---

id: "global_ruleset.baseline"
stack: "web/react"
rule_set: "baseline"
status: "beta"
summary: "Baseline accessibility rules applied across most UI work."
cache_ttl_seconds: 86400
apply_policy:
  instruction: "Apply all MUST rules that match the current change scope. If the task does not touch a scope, do not introduce unrelated changes."
  scopes_in_order: ["utility", "page", "layout", "component", "style"]

---

# Global Rules (Baseline)

## Rule: Offscreen Text Utility (sr-only)

```yaml
id: global.sr-only
scope: [utility, component, style]
```

### Must Haves
- Where a component's rules dictate the use of "offscreen text", then the snippet below must be included as a CSS class: `.sr-only`.
- Offscreen text may be used as an alternative to `aria-labelledby` or `aria-label`.

### Don'ts
- Do not hide offscreen text using `display: none` or `visibility: hidden` when it is needed for an accessible name.

### Snippets
```css
.sr-only {
  clip: rect(1px,1px,1px,1px);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
```

### Acceptance Checks
- Where offscreen text is implemented, it is not overridden by `aria-labelledby` or `aria-label`.

---

## Rule: Page Title

```yaml
id: global.page-title
scope: [page]
```

### Must Haves
- Each page (route/view/document) sets a descriptive page title that reflects the central topic of the current page.
- The page title begins with the name of the current page and is followed by the name of the site.
  - Page name and site name should be separated using a clear visual character, such as a hyphen, emdash, or vertical pipe.
  - Page name should be similar to the `<h1>` text on the page.

### Don'ts
- Do not leave the page title as a generic placeholder across routes.

### Acceptance Checks
- Browser tab title changes appropriately when navigating to the page.
- The browser tab title includes the page name and then the site name, with a clear separator between.

---

## Rule: Landmarks

```yaml
id: global.landmarks
scope: [page, layout]
```

### Must Haves
- When site or app navigation is present on a page (route/view/document), this is contained inside a `<nav>` (or `role="navigation"`) landmark, which is contained inside a `<header>` (or `role="banner"`) landmark.
  - If a single set of navigation is present, then it should be labeled (e.g., `<nav aria-label="primary">`).
  - If more than one set of navigation is present - e.g., primary and secondary or breadcrumbs - then each `navigation` landmark must be labeled (e.g., `<nav aria-label="primary">`, `<nav aria-label="secondary">`, `<nav aria-label="breadcrumbs">`).
- When a footer is present - i.e., a section at the bottom of the page with information relevant to the entire site, such as a sitemap or navigation links - this is contained inside a `<footer>` (or `role="contentinfo"`) landmark
- A `<main>` (or `role="main"`) landmark must always be present.
  - The `main` landmark contains the dominant content of the page, which directly relates to or expands upon the central topic of the page, or the central functionality of an application.
  - If site or app navigation is present at the top of the page or view (i.e., `header`), and/or a footer (`footer`) is present at the bottom of the page, the `main` landmark should wrap all content between `header` and `footer` content
  - The `main` landmark must be a sibling of the `header` and/or `footer` containers.
- If the page contains complementary content - i.e., content that is only indirectly related to the page's main content - this is contained inside an `<aside>` (or `role="complementary"`) landmark
  - The `aside` landmark is infrequently used and does not need to be present.
  - If present, the `aside` landmark should be a sibling to the `main` landmark, and to the `header` and/or `footer`, if present.

### Don'ts
- Do not use multiple `main` landmarks on the same page.
- Do not wrap the `header`, `footer`, or `aside` inside the `main` landmark, or vice-versa: these should all be siblings.

### Acceptance Checks
- There is one `main` landmark present on every page.
- If there is site or app navigation present, this is contained inside a `nav` landmark, which is contained inside a `header` landmark, sibling to the `main`.

