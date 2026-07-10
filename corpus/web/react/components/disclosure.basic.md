---
id: disclosure.basic
title: Disclosure
stack: web/react
status: beta
latest_version: 0.1.0
tags: [disclosure, show-hide, expand-collapse, button, toggle]
aliases: [disclosure, show more, expand collapse, expandable section, collapsible panel, reveal panel, toggle content, twisty]
summary: A button that shows and hides an associated content region; uses aria-expanded on the trigger and aria-controls to the region, with DOM show/hide.
---

# Disclosure

Pattern ID: `disclosure.basic`

A button that shows and hides an associated content region; uses `aria-expanded` on the trigger and `aria-controls` to the region, with DOM show/hide.

## Use When
- Use when a control shows and hides a single section of related content (e.g., "Show more details", an FAQ answer, an advanced-options or filters panel).
- Use when the revealed content is arbitrary (text, form fields, media).
- Use when a single independent expandable region is toggled by one trigger.

## Do Not Use When
- Do not use when several coordinated expandable sections form an accordion (use `accordion.basic`).
- Do not use when the revealed items are in-place commands or actions (use `menu.basic`).
- Do not use when a single trigger reveals a list of navigation links (use `navigation-menu.dropdown`).
- Do not use when the control chooses a form value (use `select.native`).

## Must Haves
- Use a native `<button>` (preferred), or `role="button"` only when a native button cannot be used.
  - If `role="button"` is used instead of a native `<button>`, add `tabindex="0"` and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating the control.
- The button reflects open state with `aria-expanded="true|false"`.
- The button references the region with `aria-controls="IDREF"`.
- The region is shown/hidden in the DOM (e.g., via the `hidden` attribute), so that when closed, its content cannot be reached by keyboard or screen readers.
- The button has an accessible name that describes the content it controls.
  - When the button has visible text, the visible text serves as the accessible name.
  - For an icon-only trigger, provide an accessible name using `aria-label` or `aria-labelledby`.
- The button omits `aria-haspopup`.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the trigger.

## Customizable
- The region may take `role="region"` with an accessible name, recommended when the region contains headings; avoid `role="region"` when it would create landmark proliferation (e.g., more than roughly 6 disclosures on one page).
- Enter and Space both toggle the region by virtue of the native `<button>`; no extra key handling is required.
- A disclosure indicator (e.g., a caret) is decorative and marked `aria-hidden="true"`.

## Don'ts
- Do not use `role="menu"` on the region.
- Do not add `aria-haspopup` to the button.
- Do not put the expanded state on the region instead of the trigger.
- Do not leave the region visible while `aria-expanded="false"` (and vice versa).

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function Disclosure({ label, children }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open ? "true" : "false"}
        aria-controls={regionId}
        onClick={() => setOpen(v => !v)}
      >
        {label}
        {/* Decorative caret; state is conveyed by aria-expanded, not the glyph. */}
        <span aria-hidden="true">{open ? " [-]" : " [+]"}</span>
      </button>

      {/* Region is removed from the accessibility tree and tab order when closed. */}
      <div id={regionId} hidden={!open}>
        {children}
      </div>
    </div>
  );
}
```

## Acceptance Checks

Keyboard
- Tab lands on the trigger button.
- A visible focus indicator appears on the trigger when it receives keyboard focus.
- Enter toggles the region between shown and hidden.
- Space toggles the region between shown and hidden.
- When the region is hidden, focus cannot reach any content inside it.

Screen Reader
- The button announces its expanded or collapsed state via `aria-expanded`, which flips between `"true"` and `"false"` on every toggle.
- The button name describes the content it controls.
- When collapsed, the region content is not reachable in reading order.
