import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = process.env.NEXT_DIST_DIR || ".next";
const standalone = resolve(root, distDir, "standalone");

if (!existsSync(standalone)) {
  throw new Error(`${distDir}/standalone was not created. Run \`next build\` first.`);
}

const staticSource = resolve(root, distDir, "static");
const staticTarget = resolve(standalone, distDir, "static");
if (existsSync(staticSource)) {
  mkdirSync(resolve(standalone, distDir), { recursive: true });
  cpSync(staticSource, staticTarget, { recursive: true, force: true });
}

const publicSource = resolve(root, "public");
const publicTarget = resolve(standalone, "public");
if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true, force: true });
}

console.log("Standalone assets copied.");
