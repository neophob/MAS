import fs from "node:fs/promises";
import { builtinModules } from "node:module";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const mdgenDir = path.resolve(import.meta.dirname, "..");
const srcDir = path.resolve(mdgenDir, "src");
const scriptsDir = path.resolve(mdgenDir, "scripts");
const packageJsonPath = path.resolve(mdgenDir, "package.json");
const nodeBuiltins = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`)
]);

const sourceFiles = await collectFiles(srcDir, ".mjs");
const shellFiles = await collectFiles(scriptsDir, ".sh");
await checkJavaScriptSyntax(sourceFiles);
await checkShellSyntax(shellFiles);
await checkDependencies(sourceFiles);

console.log(`Linted ${sourceFiles.length} JavaScript files and ${shellFiles.length} shell scripts.`);

async function collectFiles(currentDir, extension) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.resolve(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, extension));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function checkJavaScriptSyntax(files) {
  for (const file of files) {
    await execFileAsync(process.execPath, ["--check", file]);
  }
}

async function checkShellSyntax(files) {
  for (const file of files) {
    await execFileAsync("bash", ["-n", file]);
  }
}

async function checkDependencies(files) {
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const declaredDependencies = new Set(Object.keys(packageJson.dependencies ?? {}));
  const importedPackages = new Set();

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");

    for (const specifier of importSpecifiers(source)) {
      if (specifier.startsWith(".") || specifier.startsWith("/") || nodeBuiltins.has(specifier)) {
        continue;
      }

      importedPackages.add(packageNameFromSpecifier(specifier));
    }
  }

  const missing = [...importedPackages].filter((dependency) => !declaredDependencies.has(dependency));
  const unused = [...declaredDependencies].filter((dependency) => !importedPackages.has(dependency));

  if (missing.length > 0 || unused.length > 0) {
    const lines = ["Dependency lint failed."];
    if (missing.length > 0) {
      lines.push(`Missing dependencies: ${missing.join(", ")}`);
    }
    if (unused.length > 0) {
      lines.push(`Unused dependencies: ${unused.join(", ")}`);
    }
    throw new Error(lines.join("\n"));
  }
}

function importSpecifiers(source) {
  const specifiers = [];
  const fromPattern = /\bfrom\s+["']([^"']+)["']/g;
  const bareImportPattern = /^\s*import\s+["']([^"']+)["']/gm;

  for (const match of source.matchAll(fromPattern)) {
    specifiers.push(match[1]);
  }

  for (const match of source.matchAll(bareImportPattern)) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function packageNameFromSpecifier(specifier) {
  const [scopeOrName, packageName] = specifier.split("/");
  return scopeOrName.startsWith("@") ? `${scopeOrName}/${packageName}` : scopeOrName;
}
