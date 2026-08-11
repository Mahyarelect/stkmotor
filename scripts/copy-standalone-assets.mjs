import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next", "standalone");

if (!existsSync(standalone)) {
  throw new Error(".next/standalone was not created. Run `next build` first.");
}

const staticSource = resolve(root, ".next", "static");
const staticTarget = resolve(standalone, ".next", "static");
if (existsSync(staticSource)) {
  mkdirSync(resolve(standalone, ".next"), { recursive: true });
  cpSync(staticSource, staticTarget, { recursive: true, force: true });
}

const publicSource = resolve(root, "public");
const publicTarget = resolve(standalone, "public");
if (existsSync(publicSource)) {
  cpSync(publicSource, publicTarget, { recursive: true, force: true });
}

console.log("Standalone assets copied.");
