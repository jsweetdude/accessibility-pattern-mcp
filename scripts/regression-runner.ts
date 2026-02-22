/* scripts/regression-runner.ts */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

import { buildPatternIndex } from "../src/repo/index";
import { listPatterns } from "../src/tools/listPatterns";
import { getPattern } from "../src/tools/getPattern";
import { getGlobalRules } from "../src/tools/getGlobalRules";

import {
  deepSortObjectKeys,
  normalizeForSnapshot,
  loadJson,
  stableStringify,
  validateToolResponseShape,
} from "./regression-utils";

type FixtureRequest =
  | { tool: "list_patterns"; args: any }
  | { tool: "get_pattern"; args: any }
  | { tool: "get_global_rules"; args: any };

const ROOT = path.resolve(process.cwd());
const FIXTURES_DIR = path.join(ROOT, "examples", "fixtures");

const IGNORE_CACHE_TTL = process.argv.includes("--ignore-cache-ttl");
const UPDATE = process.argv.includes("--update");

// You can override TTL for index.cache here (tool response TTL can still override from file frontmatter)
const DEFAULT_INDEX_TTL_SECONDS = Number(process.env.INDEX_CACHE_TTL_SECONDS ?? 86400);

function listFixtureDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(dir, d.name));
}

async function buildIndexes(patternRepoPath: string) {
  const web = await buildPatternIndex(patternRepoPath, "web/react", DEFAULT_INDEX_TTL_SECONDS);
  const android = await buildPatternIndex(patternRepoPath, "android/compose", DEFAULT_INDEX_TTL_SECONDS);
  return { web, android };
}

function pickIndex(indexes: Awaited<ReturnType<typeof buildIndexes>>, stack: string) {
  if (stack === "web/react") return indexes.web;
  if (stack === "android/compose") return indexes.android;
  throw new Error(`Unknown stack '${stack}' in fixture args.`);
}

async function runOneFixture(
  fixtureDir: string,
  indexes: Awaited<ReturnType<typeof buildIndexes>>,
  patternRepoPath: string
) {
  const requestPath = path.join(fixtureDir, "request.json");
  const expectedPath = path.join(fixtureDir, "expected.json");

  const req = loadJson<FixtureRequest>(requestPath);

  // Most fixtures include args.stack. Enforce it.
  const stack = req.args?.stack;
  if (!stack) {
    throw new Error(`Fixture missing args.stack: ${requestPath}`);
  }

  const index = pickIndex(indexes, stack);

  let actual: any;
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
      throw new Error(`Unknown tool in fixture: ${(req as any).tool}`);
  }

  validateToolResponseShape(req.tool, actual);

  const normalized = normalizeForSnapshot(actual, { ignoreCacheTtl: IGNORE_CACHE_TTL });
  const normalizedSorted = deepSortObjectKeys(normalized);

  if (UPDATE) {
    fs.writeFileSync(expectedPath, stableStringify(normalizedSorted) + "\n", "utf8");
    return;
  }

  if (!fs.existsSync(expectedPath)) {
    throw new Error(
      `Missing expected.json for fixture: ${fixtureDir}. Run with --update to create snapshots.`
    );
  }

  const expected = loadJson<any>(expectedPath);
  const expectedSorted = deepSortObjectKeys(expected);

  try {
    assert.deepStrictEqual(normalizedSorted, expectedSorted);
  } catch {
    const actualStr = stableStringify(normalizedSorted);
    const expectedStr = stableStringify(expectedSorted);

    const aLines = actualStr.split("\n");
    const eLines = expectedStr.split("\n");

    let firstDiff = -1;
    for (let i = 0; i < Math.max(aLines.length, eLines.length); i++) {
      if (aLines[i] !== eLines[i]) {
        firstDiff = i;
        break;
      }
    }

    const contextStart = Math.max(0, firstDiff - 3);
    const contextEnd = firstDiff + 6;

    const msg =
      `Snapshot mismatch in ${fixtureDir}\n` +
      `First diff at line ${firstDiff + 1}\n\n` +
      `--- expected\n` +
      eLines.slice(contextStart, contextEnd).join("\n") +
      `\n\n--- actual\n` +
      aLines.slice(contextStart, contextEnd).join("\n") +
      `\n`;

    throw new Error(msg);
  }
}

async function main() {
  const patternRepoPath = process.env.PATTERN_REPO_PATH;
  if (!patternRepoPath) {
    throw new Error(
      `PATTERN_REPO_PATH is required.\n` +
        `Example:\n` +
        `  PATTERN_REPO_PATH=/absolute/path/to/accessibility-pattern-api npm run test:regression`
    );
  }

  const indexes = await buildIndexes(patternRepoPath);

  const stackDirs = listFixtureDirs(FIXTURES_DIR);
  const fixtureDirs: string[] = [];
  for (const stackDir of stackDirs) fixtureDirs.push(...listFixtureDirs(stackDir));

  let passed = 0;
  let failed = 0;

  for (const dir of fixtureDirs) {
    try {
      await runOneFixture(dir, indexes, patternRepoPath);
      passed++;
    } catch (e: any) {
      failed++;
      console.error(e?.message || e);
    }
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} failed, ✅ ${passed} passed`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${passed} fixtures passed`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});