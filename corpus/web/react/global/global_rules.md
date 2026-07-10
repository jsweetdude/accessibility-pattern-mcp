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

# Foundations

Foundations are the accessibility rules that aren't tied to a single component — utilities used across patterns (like `sr-only`), page-level structure (landmarks, headings, page titles), and visual fundamentals (text contrast, focus indicators). The rules below are the cross-cutting requirements every UI implementation should meet.

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
- If footer links are grouped under visible group titles (e.g., "Company", "Support", "Legal"), each group title is a level 2 heading (`<h2>`).
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
- Footer link-group titles, when present, are marked up as `<h2>` headings.
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

### Acceptance Checks
- Visible UI controls and authored state indicators needed for perception meet at least 3:1 contrast against adjacent colors.
- Meaningful icons and other non-text graphics needed for understanding meet at least 3:1 contrast against adjacent colors.

---

## Rule: Use of Color

```yaml
id: global.use-of-color
scope: [component, style]
```

### Must Haves
- Do not use color as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element (WCAG 1.4.1).
- When a component renders a meaningful state visually (e.g., selected, active, current, invalid, pressed), that state is distinguishable by something in addition to color, such as an icon, checkmark, shape, underline, or text.
  - This is the visual counterpart to exposing the state programmatically. A component may satisfy `aria-selected` yet still fail 1.4.1 if selection is shown by a background tint alone.

### Don'ts
- Do not signal selection, validity, current-ness, or availability by color alone.

### Acceptance Checks
- Every meaningful state the component renders is perceivable without relying on color (verify in grayscale).

---

## Rule: Focus Not Obscured

```yaml
id: global.focus-not-obscured
scope: [component, layout, style]
```

### Must Haves
- When a component receives keyboard focus, the focused element is not entirely hidden by author-created content such as sticky headers, sticky footers, or the component's own overlapping chrome (WCAG 2.4.11 Focus Not Obscured, Minimum).
- Components with their own sticky or floating sub-regions (e.g., a frozen header row or column) keep the focused element scrolled or offset into a visible area.

### Don'ts
- Do not let a sticky or floating region overlap and fully conceal the element that currently has keyboard focus.

### Acceptance Checks
- Tabbing or arrowing to any focusable element leaves at least part of that element and its focus indicator visible, not fully covered by sticky or overlapping content.

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
- Prefer styling keyboard focus with `:focus-visible` so the indicator is shown when users navigate by keyboard, not on mouse click.
- **Strongly recommended:** a two-layer focus style — a 2px solid ring floated 2px outside the element with a white box-shadow behind it — so the indicator remains visible against any surrounding surface (light, dark, image, or gradient). See the first snippet below.
- A simple solid outline offset from the element remains acceptable when the surrounding surfaces are known and the ring's 3:1 contrast against them is verified.
  - Starting pattern: `outline: 2px solid ...`
  - Starting offset: `outline-offset: 2px` (`1px` may be used where spacing is tighter).
- **Windows High Contrast Mode (forced-colors) support is required for any focus style.** Pair the primary style with a `@media (forced-colors: active)` override that uses the `Highlight` CSS system color and drops the box-shadow. See the shared override snippet below.

### Don'ts
- Do not use a focus indicator whose color blends into adjacent colors below the required 3:1 contrast ratio.
- Do not make the focus indicator so subtle that users cannot quickly identify which element currently has focus.
- Do not rely on hover-only styles as the only visible indicator of focus.
- Do not ship focus styles without a `forced-colors` override — Windows High Contrast Mode users will lose the custom colors and be left with browser defaults that may not match the design's contrast intent.

### Snippets

Strongly recommended two-layer focus ring. The `box-shadow` extends 4px in white around the element; the outline floats 2px outside the element edge, so the white halo sits between the element and the colored ring for surface-independent visibility:

```css
:focus-visible {
  outline: 2px solid var(--focus-ring-color, #1a73e8);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px #fff;
}
```

Acceptable simpler alternative when the surrounding surfaces are known and contrast is verified:

```css
:focus-visible {
  outline: 2px solid var(--focus-ring-color, #1a73e8);
  outline-offset: 2px;
}
```

Required forced-colors override — pair with either primary style above. `Highlight` maps to the OS-defined focus/selection color under Windows High Contrast Mode; `box-shadow: none` prevents doubled visuals under the system-managed palette:

```css
@media (forced-colors: active) {
  :focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
    box-shadow: none;
  }
}
```

### Acceptance Checks
- Every keyboard-focusable component shows a visible focus indicator when reached by keyboard navigation.
- The visible focus indicator remains present while the component has keyboard focus.
- The focus indicator has at least 3:1 contrast against adjacent colors.
- If a custom focus style is used, it is clearly visible and does not make focus harder to perceive than the default browser or platform behavior.
- Hover alone is not the only visible cue for the currently focused element.
- With Windows High Contrast Mode active (or emulated via a browser dev-tool forced-colors setting), the focus indicator remains clearly visible using the system `Highlight` color.