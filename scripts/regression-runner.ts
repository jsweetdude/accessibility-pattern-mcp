/* scripts/regression-runner.ts */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

// TODO: replace these imports with your actual tool entrypoints once I see your code.
import { listPatternsTool } from "../src/tools/listPatterns";
import { getPatternTool } from "../src/tools/getPattern";
import { getGlobalRulesTool } from "../src/tools/getGlobalRules";

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

function listFixtureDirs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(p);
  }
  return out;
}

async function runOneFixture(fixtureDir: string) {
  const requestPath = path.join(fixtureDir, "request.json");
  const expectedPath = path.join(fixtureDir, "expected.json");

  const req = loadJson<FixtureRequest>(requestPath);

  let actual: any;
  switch (req.tool) {
    case "list_patterns":
      actual = await listPatternsTool(req.args);
      break;
    case "get_pattern":
      actual = await getPatternTool(req.args);
      break;
    case "get_global_rules":
      actual = await getGlobalRulesTool(req.args);
      break;
    default:
      throw new Error(`Unknown tool in fixture: ${(req as any).tool}`);
  }

  // Shape checks (fail fast)
  validateToolResponseShape(req.tool, actual);

  // Normalize (ignore volatile fields + stable key ordering)
  const normalized = normalizeForSnapshot(actual, {
    ignoreCacheTtl: IGNORE_CACHE_TTL,
  });

  const normalizedSorted = deepSortObjectKeys(normalized);

  if (UPDATE) {
    fs.writeFileSync(expectedPath, stableStringify(normalizedSorted) + "\n", "utf8");
    return { ok: true as const };
  }

  const expected = fs.existsSync(expectedPath) ? loadJson<any>(expectedPath) : null;

  if (!expected) {
    throw new Error(
      `Missing expected.json for fixture: ${fixtureDir}. Run with --update to create.`
    );
  }

  const expectedSorted = deepSortObjectKeys(expected);

  try {
    assert.deepStrictEqual(normalizedSorted, expectedSorted);
    return { ok: true as const };
  } catch {
    const actualStr = stableStringify(normalizedSorted);
    const expectedStr = stableStringify(expectedSorted);

    // Lightweight “diff”: show first mismatch region by line
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
  const stacks = listFixtureDirs(FIXTURES_DIR);

  const fixtureDirs: string[] = [];
  for (const stackDir of stacks) {
    fixtureDirs.push(...listFixtureDirs(stackDir));
  }

  let passed = 0;
  let failed = 0;

  for (const dir of fixtureDirs) {
    try {
      await runOneFixture(dir);
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