import { spawn } from "node:child_process";
import { smokeTestBrowser } from "./browser.mjs";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

await smokeTestBrowser();
await run(npmCommand, ["run", "clean:output"]);
await run(npmCommand, ["run", "build"]);
await run("node", ["src/pixel-test.mjs"]);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}
