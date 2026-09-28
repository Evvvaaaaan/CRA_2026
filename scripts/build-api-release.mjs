import { spawnSync } from "node:child_process";
import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const apiDirectory = path.join(projectRoot, "api");
const releaseDirectory = path.join(projectRoot, "dist", "api-release");

await rm(releaseDirectory, { recursive: true, force: true });
await mkdir(path.join(releaseDirectory, "dist"), { recursive: true });

for (const file of ["host.json", "package.json", "package-lock.json", ".funcignore"]) {
  await copyFile(path.join(apiDirectory, file), path.join(releaseDirectory, file));
}

await cp(
  path.join(apiDirectory, "dist", "src"),
  path.join(releaseDirectory, "dist", "src"),
  { recursive: true },
);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const install = spawnSync(
  npmCommand,
  ["ci", "--omit=dev", "--ignore-scripts"],
  { cwd: releaseDirectory, stdio: "inherit" },
);

if (install.status !== 0) {
  throw new Error("운영 의존성 설치에 실패했습니다.");
}

console.log(`API release created: ${releaseDirectory}`);
