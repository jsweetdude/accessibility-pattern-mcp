/* scripts/smoke-stdio.mjs
 *
 * Pre-publish smoke gate: launches the published stdio entrypoint
 * (`node dist/index.js`) over a real MCP handshake and asserts the tools
 * behave. Exits non-zero on any failure. Run `npm run build` first (CI does).
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const ENTRY = path.join(ROOT, "dist", "index.js");
const BUNDLED_CORPUS = path.join(ROOT, "corpus");

if (!fs.existsSync(ENTRY)) {
  console.error(`Compiled entrypoint not found at ${ENTRY}. Run \`npm run build\` first.`);
  process.exit(1);
}

const failures = [];
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`  ok   ${name}`);
  } else {
    console.error(`  FAIL ${name}${detail ? " — " + detail : ""}`);
    failures.push(name);
  }
}

async function callJson(client, name, args) {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content?.[0]?.text ?? "";
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { isError: !!r.isError, json, text };
}

const transport = new StdioClientTransport({
  command: "node",
  args: [ENTRY],
  // Pin to the bundled corpus regardless of any stray local .env override.
  env: { PATH: process.env.PATH ?? "", PATTERN_REPO_PATH: BUNDLED_CORPUS },
});
const client = new Client({ name: "smoke-stdio", version: "0" }, { capabilities: {} });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name);
  check("handshake + tools/list", names.length === 3, `got [${names.join(", ")}]`);
  check("has list_patterns", names.includes("list_patterns"));
  check("has get_pattern", names.includes("get_pattern"));
  check("has get_foundations", names.includes("get_foundations"));

  const foundations = tools.tools.find((t) => t.name === "get_foundations");
  const foundationProps = Object.keys(foundations?.inputSchema?.properties ?? {});
  check("get_foundations declares scope", foundationProps.includes("scope"), `props: ${foundationProps.join(", ")}`);

  const lp = await callJson(client, "list_patterns", { stack: "web/react" });
  check("list_patterns returns 22 patterns", !lp.isError && lp.json?.count === 22, `count=${lp.json?.count}`);

  const gp = await callJson(client, "get_pattern", { stack: "web/react", id: "dialog.modal" });
  check(
    "get_pattern dialog.modal ok",
    !gp.isError && gp.json?.pattern?.id === "dialog.modal" && (gp.json?.pattern?.sections?.must_haves?.length ?? 0) > 0,
    `isError=${gp.isError}`
  );

  const bad = await callJson(client, "get_pattern", { stack: "web/react", id: "does.not.exist" });
  check(
    "unknown id -> structured PATTERN_NOT_FOUND",
    bad.isError && bad.json?.error_code === "PATTERN_NOT_FOUND",
    bad.text
  );

  const scoped = await callJson(client, "get_foundations", { stack: "web/react", scope: ["component"] });
  check(
    "get_foundations scope filter live",
    !scoped.isError && Array.isArray(scoped.json?.rules?.scope_filter) && scoped.json.rules.scope_filter[0] === "component",
    `scope_filter=${JSON.stringify(scoped.json?.rules?.scope_filter)}`
  );

  const unavailable = await callJson(client, "list_patterns", { stack: "android/compose" });
  check(
    "unpopulated stack -> CORPUS_UNAVAILABLE, no absolute path leak",
    unavailable.isError &&
      unavailable.json?.error_code === "CORPUS_UNAVAILABLE" &&
      !/\/Users\/|\/home\/|[A-Za-z]:\\\\/.test(unavailable.text),
    unavailable.text
  );
} catch (err) {
  console.error("smoke-stdio: unexpected error", err);
  failures.push("unexpected-error");
} finally {
  await client.close().catch(() => {});
}

if (failures.length) {
  console.error(`\n❌ smoke-stdio: ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\n✅ smoke-stdio: all checks passed");
