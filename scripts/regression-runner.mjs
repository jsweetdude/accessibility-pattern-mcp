/* scripts/regression-runner.mjs
 *
 * Snapshot regression suite. Imports the COMPILED tool/repo layer from dist/ so
 * it validates the artifacts that actually ship. Run `npm run build` first
 * (CI does). Fixtures live at examples/fixtures/<stack>/<name>/{request,expected}.json.
 *
 *   node scripts/regression-runner.mjs            # verify against snapshots
 *   node scripts/regression-runner.mjs --update   # (re)write snapshots
 *   node scripts/regression-runner.mjs --ignore-cache-ttl
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import { fileURLToPath } from "node:url";

import {
  deepSortObjectKeys,
  normalizeForSnapshot,
  loadJson,
  stableStringify,
  validateToolResponseShape,
} from "./regression-utils.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(path.join(DIST, "repo", "index.js"))) {
  console.error(
    `Compiled output not found at ${DIST}. Run \`npm run build\` before the regression suite.`
  );
  process.exit(1);
}

const { buildPatternIndex } = await import(path.join(DIST, "repo", "index.js"));
const { listPatterns } = await import(path.join(DIST, "tools", "listPatterns.js"));
const { getPattern } = await import(path.join(DIST, "tools", "getPattern.js"));
const { getGlobalRules } = await import(path.join(DIST, "tools", "getGlobalRules.js"));

const FIXTURES_DIR = path.join(ROOT, "examples", "fixtures");

const IGNORE_CACHE_TTL = process.argv.includes("--ignore-cache-ttl");
const UPDATE = process.argv.includes("--update");

const DEFAULT_INDEX_TTL_SECONDS = Number(process.env.INDEX_CACHE_TTL_SECONDS ?? 86400);

function listFixtureDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(dir, d.name));
}

// Build a stack's index at most once, and only for stacks the fixtures actually
// reference — so stacks that ship no corpus (e.g. android/compose) are never
// built and never throw before a fixture runs.
const indexByStack = new Map();
async function getIndexForStack(stack, patternRepoPath) {
  let idx = indexByStack.get(stack);
  if (!idx) {
    idx = await buildPatternIndex(patternRepoPath, stack, DEFAULT_INDEX_TTL_SECONDS);
    indexByStack.set(stack, idx);
  }
  return idx;
}

async function runOneFixture(fixtureDir, patternRepoPath) {
  const requestPath = path.join(fixtureDir, "request.json");
  const expectedPath = path.join(fixtureDir, "expected.json");

  const req = loadJson(requestPath);

  const stack = req.args?.stack;
  if (!stack) throw new Error(`Fixture missing args.stack: ${requestPath}`);

  const index = await getIndexForStack(stack, patternRepoPath);

  let actual;
  switch (req.tool) {
    case "list_patterns":
      actual = listPatterns(index, req.args);
      break;
    case "get_pattern":
      actual = await getPattern(index, patternRepoPath, req.args);
      break;
    case "get_global_rules":
      actual = await getGlobalRules(index, patternRepoPath, req.args);
      break;
    default:
      throw new Error(`Unknown tool in fixture: ${req.tool}`);
  }

  validateToolResponseShape(req.tool, actual);

  const normalized = normalizeForSnapshot(actual, { ignoreCacheTtl: IGNORE_CACHE_TTL });
  const normalizedSorted = deepSortObjectKeys(normalized);

  if (UPDATE) {
    fs.writeFileSync(expectedPath, stableStringify(normalizedSorted) + "\n", "utf8");
    return;
  }

  if (!fs.existsSync(expectedPath) || fs.statSync(expectedPath).size === 0) {
    throw new Error(
      `Missing/empty expected.json for fixture: ${fixtureDir}. Run with --update to create snapshots.`
    );
  }

  // Normalize expected with the SAME options as actual so the cache_ttl_seconds
  // strip (--ignore-cache-ttl) is symmetric; otherwise every fixture mismatches.
  const expected = normalizeForSnapshot(loadJson(expectedPath), { ignoreCacheTtl: IGNORE_CACHE_TTL });
  const expectedSorted = deepSortObjectKeys(expected);

  try {
    assert.deepStrictEqual(normalizedSorted, expectedSorted);
  } catch {
    const aLines = stableStringify(normalizedSorted).split("\n");
    const eLines = stableStringify(expectedSorted).split("\n");

    let firstDiff = -1;
    for (let i = 0; i < Math.max(aLines.length, eLines.length); i++) {
      if (aLines[i] !== eLines[i]) {
        firstDiff = i;
        break;
      }
    }

    const contextStart = Math.max(0, firstDiff - 3);
    const contextEnd = firstDiff + 6;

    throw new Error(
      `Snapshot mismatch in ${fixtureDir}\n` +
        `First diff at line ${firstDiff + 1}\n\n` +
        `--- expected\n` +
        eLines.slice(contextStart, contextEnd).join("\n") +
        `\n\n--- actual\n` +
        aLines.slice(contextStart, contextEnd).join("\n") +
        `\n`
    );
  }
}

async function main() {
  // Default to the bundled corpus so CI and local runs work with no setup;
  // override with PATTERN_REPO_PATH to test against a live corpus checkout.
  const patternRepoPath = process.env.PATTERN_REPO_PATH ?? path.join(ROOT, "corpus");

  const stackDirs = listFixtureDirs(FIXTURES_DIR);
  const fixtureDirs = [];
  for (const stackDir of stackDirs) fixtureDirs.push(...listFixtureDirs(stackDir));

  if (fixtureDirs.length === 0) {
    console.error(`No fixtures found under ${FIXTURES_DIR}`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const dir of fixtureDirs) {
    try {
      await runOneFixture(dir, patternRepoPath);
      passed++;
    } catch (e) {
      failed++;
      console.error(e?.message || e);
    }
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} failed, ✅ ${passed} passed`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${passed} fixtures ${UPDATE ? "updated" : "passed"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
