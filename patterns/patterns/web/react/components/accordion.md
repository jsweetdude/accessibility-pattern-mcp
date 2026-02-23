---
id: accordion.basic
stack: web/react
status: beta
tags: [accordion, disclosure, show-hide]
aliases: [accordion, disclosure group, expand collapse, collapsible panels]
summary: A set of show/hide sections with heading-wrapped buttons controlling associated panels via aria-expanded (and optionally aria-controls / region).
---

# Accordion

## Use When
- Use when content can be organized into collapsible sections to reduce scanning and scrolling.

## Do Not Use When
- Do not use when content must be visible for comparison or comprehension (use static, non-collapsing sections instead).

## Must Haves
- Accordion is composed of a series of header + panel pairs.
- Each accordion header control is a native `<button>` (or `role="button"` only when a native button cannot be used).
  - If role="button" is used instead of a native <button>, add tabindex="0" and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating the control.
- Each header button is contained within a heading element (`<h2>`–`<h6>`) or an element with `role="heading"` and the appropriate `aria-level`.
- The header button uses `aria-expanded="true"` when its panel is visible and `"false"` when hidden.
- The panel is shown/hidden in the DOM (e.g., via the `hidden` attribute), so that hidden content **cannot** be accessed by screen readers.
- Users move focus between accordion headers using Tab / Shift+Tab.
- Since the header control is a button, it is activated with Enter or Space.
- If the accordion does not permit a panel to be collapsed while expanded, the expanded header button uses `aria-disabled="true"` (rare case).

## Customizable
- `aria-controls` on the header button pointing to the panel ID (recommended, but optional).
- Panel container uses `role="region"` with `aria-labelledby` referencing the header button ID (optional).
  - Avoid `role="region"` when it would create landmark proliferation (e.g., many panels can be expanded at once, especially > ~6).
  - Prefer `role="region"` when panels contain headings.
- Whether multiple panels can be expanded at the same time.
  - If only one panel may be expanded, expanding a new panel collapses the previously open panel.
- The heading level will usually be `h2`, but this is customizable and depends on the heading hierarchy of the surrounding page.

## Don’ts
- Don’t use non-focusable headers (e.g., `<div>` without proper button semantics) as the interactive control.
- Don’t make the panel visible while leaving `aria-expanded="false"` (and vice versa).
- Don’t remove panel content from the DOM in a way that breaks expected focus behavior (e.g., collapsing a panel while focus remains inside it without moving focus).
- Don’t use `role="heading"` without an `aria-level`.
- Don't nest accordions within accordion panels.

## Golden Pattern
```jsx
"use client";

import * as React from "react";

export function AccordionDemo() {
  // Single-expand: exactly one panel open at a time.
  const [openId, setOpenId] = React.useState("overview");

  function toggle(id) {
    setOpenId(id);
  }

  const overviewOpen = openId === "overview";
  const detailsOpen = openId === "details";
  const shippingOpen = openId === "shipping";

  return (
    <div>
      <h3>
        <button
          id="acc-btn-overview"
          type="button"
          aria-expanded={overviewOpen ? "true" : "false"}
          aria-controls="acc-panel-overview"
          onClick={() => toggle("overview")}
        >
          Overview
        </button>
      </h3>
      <div
        id="acc-panel-overview"
        hidden={!overviewOpen}
        role="region"
        aria-labelledby="acc-btn-overview"
      >
        <p>
          This section contains summary information. Learn more in the{" "}
          <a href="#details">details section</a>.
        </p>
      </div>

      <h3>
        <button
          id="acc-btn-details"
          type="button"
          aria-expanded={detailsOpen ? "true" : "false"}
          aria-controls="acc-panel-details"
          onClick={() => toggle("details")}
        >
          Details
        </button>
      </h3>
      <div
        id="acc-panel-details"
        hidden={!detailsOpen}
        role="region"
        aria-labelledby="acc-btn-details"
      >
        <p>
          This panel includes supporting text and a link to{" "}
          <a href="#policies">policies</a>.
        </p>
      </div>

      <h3>
        <button
          id="acc-btn-shipping"
          type="button"
          aria-expanded={shippingOpen ? "true" : "false"}
          aria-controls="acc-panel-shipping"
          onClick={() => toggle("shipping")}
        >
          Shipping
        </button>
      </h3>
      <div
        id="acc-panel-shipping"
        hidden={!shippingOpen}
        role="region"
        aria-labelledby="acc-btn-shipping"
      >
        <p>Shipping information goes here. This panel contains only text.</p>
      </div>
    </div>
  );
}
```

## Acceptance Checks

- Keyboard
  - Tab/Shift+Tab moves focus through accordion header buttons in order.
  - Enter and Space toggle the associated panel visibility.
  - Focus remains on the header button after toggling.
  - If a panel is collapsed while focus is inside it (implementation choice), focus is moved to a sensible place (typically the controlling header).
- Screen Reader
  - Each header is announced as a button within a heading. 
  - The expanded/collapsed state is announced via `aria-expanded`.
  - If `role="region"` is used, the panel is announced with a name that matches the controlling header.
  - Links inside expanded panels are reachable and operate normally.
