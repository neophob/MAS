import fs from "node:fs/promises";
import path from "node:path";

export async function readCurrentGitHash(repoDir) {
  try {
    const gitDir = await resolveGitDir(repoDir);
    if (!gitDir) {
      return "unknown";
    }

    const head = (await fs.readFile(path.resolve(gitDir, "HEAD"), "utf8")).trim();
    if (/^[a-f0-9]{7,40}$/i.test(head)) {
      return head.slice(0, 7);
    }

    const ref = head.match(/^ref:\s+(.+)$/)?.[1];
    if (!ref) {
      return "unknown";
    }

    const refPath = path.resolve(gitDir, ref);
    try {
      return (await fs.readFile(refPath, "utf8")).trim().slice(0, 7);
    } catch {
      return await readPackedGitRef(gitDir, ref);
    }
  } catch {
    return "unknown";
  }
}

export function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function formatSwissDate(date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}.${month}.${year}`;
}

export function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function thesisPdfFilename(target, gitHash) {
  const safeTarget = slugify(target || "real") || "real";
  const safeHash = /^[a-f0-9]{7,40}$/i.test(gitHash) ? gitHash.slice(0, 7) : "unknown";
  return `thesis-${safeTarget}-${safeHash}.pdf`;
}

async function resolveGitDir(repoDir) {
  const dotGit = path.resolve(repoDir, ".git");
  const stat = await fs.stat(dotGit).catch(() => undefined);
  if (!stat) {
    return undefined;
  }

  if (stat.isDirectory()) {
    return dotGit;
  }

  const content = await fs.readFile(dotGit, "utf8");
  const gitDir = content.match(/^gitdir:\s*(.+)$/m)?.[1]?.trim();
  if (!gitDir) {
    return undefined;
  }

  return path.resolve(repoDir, gitDir);
}

async function readPackedGitRef(gitDir, ref) {
  const packedRefs = await fs.readFile(path.resolve(gitDir, "packed-refs"), "utf8");
  const line = packedRefs
    .split(/\r?\n/)
    .find((entry) => entry.endsWith(` ${ref}`));
  return line?.split(" ")[0]?.slice(0, 7) ?? "unknown";
}
