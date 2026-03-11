# accessibility-pattern-api

A structured corpus of production-ready accessibility patterns for modern UI frameworks.
Each pattern provides prescriptive guidance, a golden implementation, and acceptance checks —
ready for AI context injection, design system documentation, or direct developer reference.

---

## Repository structure

```
/patterns          ← source of truth for all content
  /web/react       ← React (Web) corpus
    patterns.json  ← catalog: ids, titles, source paths
    /components    ← one .md file per component pattern
    /global        ← cross-cutting rules (Foundations)
  /android         ← Android Compose (stub)
  /ios             ← iOS SwiftUI (stub)

/website           ← Docusaurus site (sourced from /patterns)
  docusaurus.config.js
  sidebars-web-react.js   ← sidebar generated from patterns.json
  sidebars-android.js
  sidebars-ios.js
  /src/pages/index.js     ← site home page
  /src/css/custom.css     ← theme / styling
```

---

## Docs website

The `/website` Docusaurus site reads its content directly from `/patterns`.
`/patterns` is the **only** place you need to edit to update the docs.

### How docs are sourced from `/patterns`

- The `web-react` docs plugin instance points its `path` at `../patterns/web/react`.
- Docusaurus discovers every `.md` file there, using the `id` in each file's YAML frontmatter as the stable doc ID.
- The left sidebar order and labels come from `patterns/web/react/patterns.json` — the `title` field becomes the sidebar label and the `id` field is used to look up the matching doc.
- To add a new component pattern:
  1. Add a `.md` file to `patterns/web/react/components/` with YAML frontmatter including `id`, `title`, `slug`, `stack`, and `status`.
  2. Add a corresponding entry to `patterns/web/react/patterns.json`.
  3. The sidebar and docs site update automatically on next build.

### Run locally

```bash
cd website
npm install        # first time only
npm start          # starts dev server at http://localhost:3000
```

> **Node ≥ 18** is required.

### Build for production

```bash
cd website
npm run build      # output goes to website/build/
npm run serve      # preview the production build locally
```

### Deploy on Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `website` |
| Build Command | `npm run build` |
| Output Directory | `build` |
| Install Command | `npm install` |
| Node version | 18 or 20 |

Vercel will automatically rebuild on every push to `main`.

---

## Validate patterns catalog

```bash
npm run validate   # runs scripts/validate-patterns.js from repo root
```