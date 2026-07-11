/**
 * scripts/sync-corpus.mjs
 *
 * Refreshes the bundled read-slice of the corpus that ships inside this package
 * (`corpus/<stack>/`) from a checkout of the corpus repo.
 *
 * What it copies (the read-slice only):
 *   <source>/patterns/<stack>/patterns.json          -> corpus/<stack>/patterns.json
 *   <source>/patterns/<stack>/global/global_rules.md -> corpus/<stack>/global/global_rules.md
 *   <source>/patterns/<stack>/components/<id>.md      -> corpus/<stack>/components/<id>.md
 *
 * Membership is driven by patterns.json: only the components listed there are
 * copied. That set is exactly the published catalog, so `status: draft` and
 * `status: deprecated` components (which are NOT in patterns.json) are excluded.
 * As a guard, each copied component's own frontmatter status is verified to be
 * a published status; a draft/deprecated member aborts the sync.
 *
 * Usage:
 *   npm run sync-corpus -- --source /path/to/accessibility-pattern-api
 *   npm run sync-corpus -- --source <path> --stack web/react
 *   npm run sync-corpus -- --source <path> --dry-run
 *
 * The source may also be given via the A11Y_CORPUS_SOURCE environment variable.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const PUBLISHED_STATUSES = new Set(["alpha", "beta", "stable"]);
const EXCLUDED_STATUSES = new Set(["draft", "deprecated"]);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(SCRIPT_DIR, "..");

function parseArgs(argv) {
  let source = process.env.A11Y_CORPUS_SOURCE ?? null;
  let stack = "web/react";
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--source") source = argv[++i] ?? source;
    else if (a.startsWith("--source=")) source = a.slice("--source=".length);
    else if (a === "--stack") stack = argv[++i] ?? stack;
    else if (a.startsWith("--stack=")) stack = a.slice("--stack=".length);
    else if (a === "--dry-run") dryRun = true;
  }

  return { source, stack, dryRun };
}

function readCatalog(catalogPath) {
  const text = fs.readFileSync(catalogPath, "utf8");
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.patterns)
      ? parsed.patterns
      : Array.isArray(parsed.items)
        ? parsed.items
        : null;
  if (!arr) throw new Error(`patterns.json has no patterns/items array: ${catalogPath}`);
  const catalog_revision =
    typeof parsed.catalog_revision === "string" ? parsed.catalog_revision : "unknown";
  return { catalog_revision, entries: arr };
}

function frontmatterStatus(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = matter(raw).data ?? {};
  return String(data.status ?? "").trim();
}

function main() {
  const { source, stack, dryRun } = parseArgs(process.argv.slice(2));

  if (!source) {
    console.error(
      "sync-corpus: no source given.\n" +
        "  Pass --source <path-to-corpus-repo> or set A11Y_CORPUS_SOURCE.\n" +
        "  Expected layout: <source>/patterns/<stack>/{patterns.json, global/global_rules.md, components/*.md}"
    );
    process.exit(1);
  }

  const sourceSlice = path.join(source, "patterns", stack);
  const srcCatalog = path.join(sourceSlice, "patterns.json");
  const srcGlobal = path.join(sourceSlice, "global", "global_rules.md");
  const srcComponentsDir = path.join(sourceSlice, "components");

  for (const [label, p] of [
    ["patterns.json", srcCatalog],
    ["global/global_rules.md", srcGlobal],
    ["components/", srcComponentsDir],
  ]) {
    if (!fs.existsSync(p)) {
      console.error(`sync-corpus: missing source ${label} at ${p}`);
      process.exit(1);
    }
  }

  const { catalog_revision, entries } = readCatalog(srcCatalog);

  // Resolve member component files from patterns.json membership.
  const memberRelPaths = [];
  const memberBasenames = new Set();
  for (const entry of entries) {
    const id = typeof entry.id === "string" ? entry.id : "(unknown)";
    const rel = typeof entry.source?.path === "string" ? entry.source.path : "";
    if (!rel) {
      console.error(`sync-corpus: catalog entry '${id}' has no source.path`);
      process.exit(1);
    }
    // Containment: source.path must stay inside the stack slice — a '..' segment
    // or absolute path would let a malformed catalog read/write outside the tree.
    const normRel = path.normalize(rel);
    if (path.isAbsolute(normRel) || normRel.split(/[/\\]/).includes("..")) {
      console.error(`sync-corpus: catalog member '${id}' has an unsafe source.path '${rel}'`);
      process.exit(1);
    }
    const srcFile = path.join(sourceSlice, rel);
    if (!fs.existsSync(srcFile)) {
      console.error(`sync-corpus: catalog member '${id}' points at missing file ${rel}`);
      process.exit(1);
    }
    const status = frontmatterStatus(srcFile);
    if (EXCLUDED_STATUSES.has(status) || !PUBLISHED_STATUSES.has(status)) {
      console.error(
        `sync-corpus: catalog member '${id}' has non-published status '${status}' (${rel}). ` +
          `patterns.json must list only published components.`
      );
      process.exit(1);
    }
    memberRelPaths.push(rel);
    memberBasenames.add(path.basename(rel));
  }

  // Report source components excluded from the bundle (drafts/deprecated etc.).
  const excluded = fs
    .readdirSync(srcComponentsDir)
    .filter((f) => /\.(md|mdx|markdown)$/.test(f))
    .filter((f) => !memberBasenames.has(f));

  const destSlice = path.join(PACKAGE_ROOT, "corpus", stack);
  const destComponentsDir = path.join(destSlice, "components");
  const destGlobalDir = path.join(destSlice, "global");

  console.log(`sync-corpus: source     = ${sourceSlice}`);
  console.log(`sync-corpus: dest       = ${destSlice}`);
  console.log(`sync-corpus: stack      = ${stack}`);
  console.log(`sync-corpus: revision   = ${catalog_revision}`);
  console.log(`sync-corpus: components = ${memberRelPaths.length} published`);
  if (excluded.length) {
    console.log(`sync-corpus: excluded   = ${excluded.length} (${excluded.join(", ")})`);
  }

  if (dryRun) {
    console.log("sync-corpus: --dry-run, no files written.");
    return;
  }

  // Refuse to write an empty bundle. The published read-slice is never
  // legitimately zero components, so a stubbed/mis-pathed source must abort
  // BEFORE the destructive rm below rather than silently wipe corpus/<stack>.
  if (memberRelPaths.length === 0) {
    console.error(
      `sync-corpus: refusing to write — patterns.json lists 0 components (${srcCatalog}). ` +
        `Check --source / --stack.`
    );
    process.exit(1);
  }

  // Rebuild the components dir so removed patterns don't linger.
  fs.rmSync(destComponentsDir, { recursive: true, force: true });
  fs.mkdirSync(destComponentsDir, { recursive: true });
  fs.mkdirSync(destGlobalDir, { recursive: true });

  for (const rel of memberRelPaths) {
    fs.copyFileSync(path.join(sourceSlice, rel), path.join(destSlice, rel));
  }
  fs.copyFileSync(srcGlobal, path.join(destGlobalDir, "global_rules.md"));
  fs.copyFileSync(srcCatalog, path.join(destSlice, "patterns.json"));

  console.log(
    `sync-corpus: wrote ${memberRelPaths.length} components + global_rules.md + patterns.json ` +
      `(catalog_revision ${catalog_revision}).`
  );
}

main();
