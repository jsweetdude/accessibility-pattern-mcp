/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PATTERNS_DIR = path.join(ROOT, "patterns");

const REQUIRED_FIELDS = ["id", "stack", "status", "summary", "tags"];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function parseFrontmatter(md) {
  // Expect YAML frontmatter between --- lines at top of file
  if (!md.startsWith("---\n")) return null;
  const end = md.indexOf("\n---", 4);
  if (end === -1) return null;
  const yamlBlock = md.slice(4, end).trim();
  return yamlBlock;
}

function yamlToObjectLoose(yaml) {
  // Minimal, forgiving parser: handles "key: value" and "key: [a,b]"
  // Good enough for Phase 1 validation. (We can switch to a real YAML parser later.)
  const obj = {};
  const lines = yaml.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    // Parse simple arrays: [a, b]
    if (value.startsWith("[") && value.endsWith("]")) {
      const inner = value.slice(1, -1).trim();
      obj[key] = inner
        ? inner.split(",").map(s => s.trim()).filter(Boolean)
        : [];
    } else if (value === "true") obj[key] = true;
    else if (value === "false") obj[key] = false;
    else obj[key] = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  }
  return obj;
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(PATTERNS_DIR)) {
    fail(`Missing /patterns directory at ${PATTERNS_DIR}`);
    return;
  }

  const files = walk(PATTERNS_DIR)
    .filter(f => f.endsWith(".md"))
    .filter(f => !f.endsWith(".gitkeep"));

  if (files.length === 0) {
    console.log("ℹ️ No pattern markdown files found yet (ok for now).");
    return;
  }

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const md = fs.readFileSync(file, "utf8");
    const fm = parseFrontmatter(md);
    if (!fm) {
      fail(`${rel}: missing YAML frontmatter (must start with ---)`);
      continue;
    }
    const meta = yamlToObjectLoose(fm);

    for (const field of REQUIRED_FIELDS) {
      if (!(field in meta)) fail(`${rel}: missing required frontmatter field "${field}"`);
    }

    // Basic sanity checks
    if (meta.tags && !Array.isArray(meta.tags)) {
      fail(`${rel}: "tags" must be an array like [dialog, modal]`);
    }

    // Optional: filename matches id
    if (meta.id) {
      const expected = `${meta.id}.md`;
      const actual = path.basename(file);
      if (expected !== actual) {
        fail(`${rel}: filename should match id. Expected "${expected}" but found "${actual}"`);
      }
    }
  }

  if (process.exitCode === 1) {
    console.log("\nFix the issues above, then rerun: npm run validate");
  } else {
    console.log("✅ Pattern validation passed.");
  }
}

main();
