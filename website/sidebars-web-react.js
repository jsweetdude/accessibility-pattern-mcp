// @ts-check
'use strict';

/**
 * Sidebar for the React (Web) docs instance.
 * Component entries are generated from patterns/web/react/patterns.json
 * so the catalog remains the single source of truth for order and labels.
 */

const fs = require('fs');
const path = require('path');

// ── 1. Resolve and validate patterns.json ─────────────────────────────────────

const patternsPath = path.resolve(__dirname, '../patterns/web/react/patterns.json');

if (!fs.existsSync(patternsPath)) {
  throw new Error(
    `[sidebars-web-react] patterns.json not found at: ${patternsPath}\n` +
    `The /patterns directory must be a sibling of /website in the repo root.\n` +
    `On Vercel, confirm the root directory is set to "website" (not the repo root).`
  );
}

/** @type {{ patterns: Array<{ id: string, title: string, source: { path: string } }> }} */
const patternsJson = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));

// ── 2. Diagnostic logging (visible in Vercel build logs) ─────────────────────

console.log(`[sidebars-web-react] Loaded: ${patternsPath}`);
console.log(`[sidebars-web-react] Patterns: ${patternsJson.patterns.length} loaded`);
console.log(
  `[sidebars-web-react] First 3 ids: ${patternsJson.patterns
    .slice(0, 3)
    .map((p) => p.id)
    .join(', ')}`
);

// ── 3. Validate each pattern has a corresponding markdown file ────────────────

const docsRoot = path.resolve(__dirname, '../patterns/web/react');

patternsJson.patterns.forEach((p) => {
  const mdFile = path.resolve(docsRoot, p.source.path);
  if (!fs.existsSync(mdFile)) {
    throw new Error(
      `[sidebars-web-react] Missing markdown file for pattern '${p.id}'.\n` +
      `  Expected: ${mdFile}\n` +
      `  Check the "source.path" field in patterns.json.`
    );
  }
});

// ── 4. Build sidebar config ───────────────────────────────────────────────────

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  webReactSidebar: [
    // intro.md has slug "/" — renders at /web/react
    {
      type: 'doc',
      id: 'intro',
      label: 'Overview',
    },
    {
      type: 'doc',
      // global/global_rules.md has frontmatter id "global_ruleset.baseline"
      // Docusaurus resolves this as <dir>/<frontmatter-id>
      id: 'global/global_ruleset.baseline',
      label: 'Foundations',
    },
    {
      type: 'doc',
      id: 'component-gallery',
      label: 'Component Gallery',
    },
    {
      type: 'category',
      label: 'Components',
      collapsible: true,
      collapsed: false,
      // URL contract: /web/react/components/<p.id>
      // Derived from: file in components/ dir + frontmatter id = components/<p.id>
      // No per-file slug needed — auto-derived is stable and matches p.id.
      items: patternsJson.patterns.map((p) => ({
        type: 'doc',
        id: `components/${p.id}`,
        label: p.title,
      })),
    },
    {
      type: 'doc',
      id: 'release-notes',
      label: 'Release Notes',
    },
  ],
};

module.exports = sidebars;
