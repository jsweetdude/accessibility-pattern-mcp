---

id: "global_ruleset.baseline"
title: "Foundations"
slug: "/foundations"
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

---

## Rule: Heading Structure

```yaml
id: global.headings
scope: [page, layout]
```

### Must Haves
- Each page (route/view/document) has one level 1 heading, or `<h1>`, that identifies the main topic of the page.
- Headings are nested in a logical order according to the relationships of the content they introduce.
  - An `<h2>` introduces a major section of the page.
  - An `<h3>` introduces a subsection of the preceding `<h2>`, and so on.
  - When closing a subsection and returning to a higher-level section, it is acceptable to return to a higher heading level.
- If text visually functions as a heading, it must be marked up as a heading element rather than only styled to look like one.
- Headings are descriptive of the content they introduce.

### Customizable
- Section headings use native HTML heading elements (`<h1>` through `<h6>`) to communicate the structure of the page.
  - If native elements are unavailable, headings can be implemented with `role="heading"` and `aria-level`.

### Don'ts
- Do not use heading elements only to make text look larger or bolder.
- Do not skip heading levels when moving deeper into the hierarchy, such as going from `<h2>` directly to `<h4>`, unless closing a subsection and returning to a higher-level section.
- Do not use non-heading elements as visual-only section titles when they function as headings.

### Acceptance Checks
- Each page has one clear primary heading that identifies the main topic of the page.
- The heading structure forms a logical outline of the content.
- When heading depth increases, levels are not skipped.
- Headings are descriptive of the content they introduce.
- Text that appears visually to be a heading is programmatically marked up as a heading.
- No empty heading elements are present.

---

## Rule: Text Contrast

```yaml
id: global.text-contrast
scope: [page, layout, component, style]
```

### Must Haves
- Text and images of text must have sufficient contrast against their background.
  - Normal-size text must meet a contrast ratio of at least 4.5:1.
  - Large-scale text (18pt regular, or 14pt bold) must meet a contrast ratio of at least 3:1.

### Don'ts
- Do not use color combinations for text that fall below 4.5:1 for normal text or 3:1 for large text.

### Acceptance Checks
- Normal text meets at least 4.5:1 contrast against its background.
- Large-scale text meets at least 3:1 contrast against its background.

---

## Rule: Non-text Contrast

```yaml
id: global.non-text-contrast
scope: [page, component, style]
```

### Must Haves
- Visual information needed to identify a user interface component - such as control boundaries - must have a contrast ratio of at least 3:1 against adjacent colors.
  - In other words, a component's border or background color must contrast at least 3:1 against the page's background color.
- Meaningful graphical objects must have a contrast ratio of at least 3:1 against adjacent colors when their appearance is needed to understand the content.
  - This includes meaningful icons, simple charts, data marks, indicators, and other non-decorative graphics.

### Don'ts
- Do not use very low-contrast borders, outlines, or icons when they are necessary to identify a control or its current state.
- Visible UI controls and authored state indicators needed for perception meet at least 3:1 contrast against adjacent colors.
- Meaningful icons and other non-text graphics needed for understanding meet at least 3:1 contrast against adjacent colors.

### Acceptance Checks
- Normal text meets at least 4.5:1 contrast against its background.
- Large-scale text meets at least 3:1 contrast against its background.
- Visible UI controls and authored state indicators needed for perception meet at least 3:1 contrast against adjacent colors.
- Meaningful icons and other non-text graphics needed for understanding meet at least 3:1 contrast against adjacent colors.

---

## Rule: Focus States

```yaml
id: global.focus-states
scope: [component, style]
```

### Must Haves
- Each keyboard-focusable user interface component must have a visible focus indicator when it receives keyboard focus.
- The focus indicator must have a contrast ratio of at least 3:1 against adjacent colors.

### Customizable 
- The focus indicator may take different forms, such as an outline, border, background change, underline, or other visible treatment, provided that it clearly indicates which element currently has keyboard focus.
- Prefer styling keyboard focus with `:focus-visible` so the indicator is shown when users navigate by keyboard.
- A recommended focus style is a solid outline that is offset from the element.
  - Recommended starting pattern: `outline: 2px solid ...`
  - Recommended starting offset: `outline-offset: 2px`
  - `outline-offset: 1px` may also be used where spacing is tighter.

### Don'ts
- Do not use a focus indicator whose color blends into adjacent colors below the required 3:1 contrast ratio.
- Do not make the focus indicator so subtle that users cannot quickly identify which element currently has focus.
- Do not rely on hover-only styles as the only visible indicator of focus.

### Snippets

```css
:focus-visible {
  outline: 2px solid var(--focus-ring-color, #1a73e8);
  outline-offset: 2px;
}
```

### Acceptance Checks
- Every keyboard-focusable component shows a visible focus indicator when reached by keyboard navigation.
- The visible focus indicator remains present while the component has keyboard focus.
- The focus indicator has at least 3:1 contrast against adjacent colors.
- If a custom focus style is used, it is clearly visible and does not make focus harder to perceive than the default browser or platform behavior.
- Hover alone is not the only visible cue for the currently focused element.