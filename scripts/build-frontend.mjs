import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectRoot, "dist", "frontend");
const apiBaseUrl = process.argv[2];
const assetVersion = Date.now().toString(36);

if (!apiBaseUrl) {
  throw new Error(
    "사용법: node scripts/build-frontend.mjs https://<function-app>.azurewebsites.net/api",
  );
}

const parsedApiUrl = new URL(apiBaseUrl);
if (parsedApiUrl.protocol !== "https:") {
  throw new Error("배포용 API 주소는 HTTPS여야 합니다.");
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const page of [
  "index.html",
  "spot.html",
  "clean-spots.html",
  "disposal-guide.html",
  "disposal-check.html",
  "about.html",
  "faq.html",
  "report.html",
]) {
  const sourcePath = path.join(projectRoot, page);
  const sourceHtml = await readFile(sourcePath, "utf8");
  const apiConfiguredHtml = sourceHtml.replace(
    '<meta name="borilje-api-base" content="" />',
    `<meta name="borilje-api-base" content="${apiBaseUrl.replace(/\/$/, "")}" />`,
  );

  if (apiConfiguredHtml === sourceHtml) {
    throw new Error(`${page}에서 API 주소 메타 태그를 찾지 못했습니다.`);
  }

  const configuredHtml = apiConfiguredHtml.replace(
    /((?:href|src)=")([^"?]+\.(?:css|js))(")/g,
    `$1$2?v=${assetVersion}$3`,
  );

  await writeFile(path.join(outputDirectory, page), configuredHtml, "utf8");
}

for (const file of [
  "app.js",
  "spot-detail.js",
  "spot.css",
  "subpage.css",
  "report.js",
  "motion.js",
  "style.css",
  "background1.png",
  "staticwebapp.config.json",
]) {
  await copyFile(path.join(projectRoot, file), path.join(outputDirectory, file));
}

await cp(path.join(projectRoot, "images"), path.join(outputDirectory, "images"), {
  recursive: true,
});
await cp(path.join(projectRoot, "assets"), path.join(outputDirectory, "assets"), {
  recursive: true,
});

console.log(`Frontend build created: ${outputDirectory}`);
