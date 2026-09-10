import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const args = process.argv.slice(2);

function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const imageDir = option("--images");
const videoDir = option("--videos");
const fallbackFiles = args
  .filter((value, index) => args[index - 1] === "--fallback")
  .map((value) => resolve(value));

if (!imageDir || !videoDir || fallbackFiles.length !== 3) {
  throw new Error(
    "Usage: node scripts/import-product-media.mjs --images <dir> --videos <dir> --fallback <image> --fallback <image> --fallback <image>"
  );
}

const seed = JSON.parse(readFileSync(resolve(root, "prisma/seed-data.json"), "utf8"));
const skuSet = new Set(seed.variants.map((variant) => String(variant.sku)));
const assetDir = resolve(root, "public/media/products/assets");
const fallbackDir = resolve(root, "public/media/products/fallback");
const manifestPath = resolve(root, "src/data/product-media.json");
mkdirSync(assetDir, { recursive: true });
mkdirSync(fallbackDir, { recursive: true });

const manifest = {};
for (const sku of skuSet) manifest[sku] = { images: [], videos: [] };
const assetScores = new Map();

function sourceOrder(filename) {
  const stem = basename(filename, extname(filename));
  const dotCount = (stem.match(/\./g) || []).length;
  const copyNumber = Number(stem.match(/\((\d+)\)/)?.[1] || 0);
  return dotCount * 100 + copyNumber;
}

async function importDirectory(directory, extension, field) {
  const files = readdirSync(resolve(directory), { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === extension)
    .map((entry) => entry.name)
    .sort((a, b) => sourceOrder(b) - sourceOrder(a) || a.localeCompare(b));

  for (const filename of files) {
    const source = resolve(directory, filename);
    const buffer = readFileSync(source);
    const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 20);
    const targetName = `${digest}${extension}`;
    const target = resolve(assetDir, targetName);
    copyFileSync(source, target);
    const publicPath = `/media/products/assets/${targetName}`;
    let visualScore = sourceOrder(filename) / 100_000;
    if (field === "images") {
      const metadata = await sharp(source).metadata();
      const aspect = (metadata.width || 1) / (metadata.height || 1);
      const aspectScore = 1 - Math.min(Math.abs(aspect - 9 / 16), 1);
      let coverage = 1;
      if (metadata.hasAlpha) {
        const trimmed = await sharp(source)
          .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .metadata();
        coverage = ((trimmed.width || 1) * (trimmed.height || 1)) /
          ((metadata.width || 1) * (metadata.height || 1));
      }
      const opaqueBackgroundBonus = metadata.hasAlpha ? 0 : 2;
      visualScore += coverage * 10 + aspectScore + opaqueBackgroundBonus;
    }
    assetScores.set(publicPath, Math.max(assetScores.get(publicPath) || 0, visualScore));
    const matchedSkus = [...new Set(filename.match(/\d+/g) || [])].filter((value) => skuSet.has(value));

    if (matchedSkus.length === 0) {
      throw new Error(`No product SKU found in ${filename}`);
    }

    for (const sku of matchedSkus) {
      if (!manifest[sku][field].includes(publicPath)) manifest[sku][field].push(publicPath);
    }
  }
}

await importDirectory(imageDir, ".webp", "images");
await importDirectory(videoDir, ".mp4", "videos");

for (const media of Object.values(manifest)) {
  media.images.sort((a, b) => (assetScores.get(b) || 0) - (assetScores.get(a) || 0));
  media.videos.sort((a, b) => (assetScores.get(b) || 0) - (assetScores.get(a) || 0));
}

const compactManifest = Object.fromEntries(
  Object.entries(manifest).filter(([, media]) => media.images.length > 0 || media.videos.length > 0)
);

fallbackFiles.forEach((source, index) => {
  copyFileSync(source, resolve(fallbackDir, `electromotor-${index + 1}.png`));
});

writeFileSync(manifestPath, `${JSON.stringify(compactManifest, null, 2)}\n`);

const imageAssociations = Object.values(compactManifest).reduce((sum, media) => sum + media.images.length, 0);
const videoAssociations = Object.values(compactManifest).reduce((sum, media) => sum + media.videos.length, 0);
console.log(
  `Imported media for ${Object.keys(compactManifest).length} SKUs (${imageAssociations} image and ${videoAssociations} video associations).`
);
