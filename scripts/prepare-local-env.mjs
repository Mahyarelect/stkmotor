import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envPath = resolve(root, ".env");
const examplePath = resolve(root, ".env.example");

let text = existsSync(envPath)
  ? readFileSync(envPath, "utf8")
  : existsSync(examplePath)
    ? readFileSync(examplePath, "utf8")
    : "";

function readValue(name) {
  const match = text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)\\s*$`, "m"));
  if (!match) return "";
  return match[1].trim().replace(/^['\"]|['\"]$/g, "");
}

function writeValue(name, value) {
  const quoted = `${name}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^\\s*${name}\\s*=.*$`, "m");
  if (pattern.test(text)) {
    text = text.replace(pattern, quoted);
  } else {
    if (text && !text.endsWith("\n")) text += "\n";
    text += `${quoted}\n`;
  }
}

if (!readValue("DATABASE_URL") || readValue("DATABASE_URL").startsWith("file:")) {
  writeValue("DATABASE_URL", "postgresql://stkuser:stkpassword@127.0.0.1:5432/stkmotor?schema=public");
}

const currentSecret = readValue("JWT_SECRET");
if (!currentSecret || currentSecret.includes("replace-with") || currentSecret.length < 32) {
  const secret = randomBytes(48).toString("base64url");
  writeValue("JWT_SECRET", secret);
}

if (!readValue("ADMIN_USERNAME")) {
  writeValue("ADMIN_USERNAME", "admin");
}

const currentPassword = readValue("ADMIN_PASSWORD");
if (!currentPassword || currentPassword === "change-this-before-production") {
  writeValue("ADMIN_PASSWORD", "Admin123456!");
}

if (!readValue("ADMIN_NAME")) {
  writeValue("ADMIN_NAME", "مدیر سایت");
}

if (!readValue("DIDAR_API_KEY")) {
  writeValue("DIDAR_API_KEY", "96n9yze8bh44j8xpghr5pbs4gs6s5rv3");
}

if (!readValue("DIDAR_PIPELINE_ID")) {
  writeValue("DIDAR_PIPELINE_ID", "5e5b295e-155c-4f79-a3b6-c23e39ab9ec9");
}

if (!readValue("DIDAR_STAGE_ID")) {
  writeValue("DIDAR_STAGE_ID", "9548e842-86f2-4db3-aa51-b41b16b4767d");
}

if (!readValue("DIDAR_OWNER_ID")) {
  writeValue("DIDAR_OWNER_ID", "6b60f98f-7594-40e4-ba9c-2d3e53876d7b");
}

writeFileSync(envPath, text, "utf8");

console.log("[env] Local environment is ready.");
console.log(`[env] Admin username: ${readValue("ADMIN_USERNAME")}`);
console.log(`[env] Admin password: ${readValue("ADMIN_PASSWORD")}`);
console.log("[env] Change the local password before using this project in production.");
