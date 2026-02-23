---
id: collection-row.basic
stack: web/react
status: beta
tags: [collection-row, shelf, rail, horizontal-list, ecommerce, navigation]
aliases: [content row, content rail, rail, strip, shelf, multi item carousel, product row]
summary: Horizontal product shelf with a heading, list semantics, and Prev/Next paging that moves focus to newly revealed items.
---

# Collection Row

## Use When
- Use when displaying multiple related items in a horizontally scrollable row under a shared category heading (e.g., e.g., “Customers Also Viewed”, “Action Movies”).
- Use when multiple items are visible simultaneously and can be scrolled left or right.
- Use when each item is a compact card with a primary visual element and brief supporting text.

## Do Not Use When
- Do not use when only one item is visible at a time within a rotatable sequence (use `carousel`).
- Do not use when items are arranged in a multi-row or multi-column layout (use `grid`).
- Do not use when items are presented as a simple vertical list without horizontal scrolling (use `list`).

## Must Haves
- Use a visible heading, typically an `<h2>`, above the row.
- Use list semantics for the row: `ul` with `li` items.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) on each item and button.
- Each item must comprise a single focus stop: in other words, consist of a single link `<a>` that contains:
  - A visual element (image, poster, thumbnail, or media preview).
  - A visible title that identifies the item.
  - Optional visible metadata (e.g., price, episode number, rating).
- Each item link must have an accessible name composed of:
  - title + metadata (optional) via `aria-labelledby`
- Each item link should expose position context (e.g., “3 of 18”) as supplemental information:
  - Provide an offscreen “X of Y” element.
  - Reference it via `aria-describedby`.
  - The position must reflect the item’s index within the full set, not just the currently visible subset.
- Provide paging controls:
  - Next button on the right edge of the row container (vertically centered)
  - Previous button on the left edge when not on the first page
- Paging focus behavior:
  - Activating Next moves focus to the first newly revealed item (left-most visible link).
    - For example, if items 1 through 6 are visible, and the user activates the Next button, then items 7 through 12 become visible, and focus moves to item 7.
  - Activating Previous moves focus to the last newly revealed item (right-most visible link)
 
## Customizable
- In the golden pattern, we wrap the component in a container with `role="group"` and `aria-labelledby` pointing to the heading ID. This is optional. Engineers may choose instead to use a `<section>` or `role="region"`, or to eschew the container entirely.
- Items must at minimum have some "title" text that gives each item a name, but they are not required to also have metadata, like a price, or rating, etc.

## Don’ts
- When a user's focus is on the last visible item, and they press Tab, focus should move to a 'Next' button, not to the next item in the collection row.
- Don’t split the item into multiple separate interactive elements (one item = one link).
- Do not rely solely on poster art or imagery to communicate the name of each item.

## Golden Pattern
```js
"use client";

import * as React from "react";

export function CollectionRow({ heading = "Customers Also Viewed", items = ITEMS, pageSize = 4 }) {
  const headingId = React.useId();
  const [startIndex, setStartIndex] = React.useState(0);

  const linkRefs = React.useRef([]);

  const total = items.length;
  const endIndex = Math.min(startIndex + pageSize, total);
  const visible = items.slice(startIndex, endIndex);

  const canPrev = startIndex > 0;
  const canNext = endIndex < total;

  function goNext() {
    if (!canNext) return;
    const nextStart = Math.min(startIndex + pageSize, Math.max(total - pageSize, 0));
    setStartIndex(nextStart);
    requestAnimationFrame(() => linkRefs.current[0]?.focus());
  }

  function goPrev() {
    if (!canPrev) return;
    const prevStart = Math.max(startIndex - pageSize, 0);
    setStartIndex(prevStart);
    requestAnimationFrame(() => linkRefs.current[visible.length - 1]?.focus());
  }

  return (
    <div role="group" aria-labelledby={headingId}>
      <h2 id={headingId}>{heading}</h2>

      {canPrev && (
        <button type="button" onClick={goPrev} aria-label="Previous items">
          Prev
        </button>
      )}

      <ul>
        {visible.map((item, i) => {
          const globalIndex = startIndex + i;
          const titleId = `${headingId}-title-${globalIndex}`;
          const metaId = `${headingId}-meta-${globalIndex}`;
          const posId = `${headingId}-pos-${globalIndex}`;

          return (
            <li key={item.id}>
              <a
                href={item.href}
                ref={(el) => (linkRefs.current[i] = el)}
                aria-labelledby={`${titleId} ${metaId}`}
                aria-describedby={posId}
              >
                <span aria-hidden="true">[image]</span>
                <div id={titleId}>{item.title}</div>
                <span id={posId} style={srOnly}>
                  {globalIndex + 1} of {total}
                </span>
                <div id={metaId}>{item.meta}</div>
              </a>
            </li>
          );
        })}
      </ul>

      {canNext && (
        <button type="button" onClick={goNext} aria-label="Next items">
          Next
        </button>
      )}
    </div>
  );
}

const srOnly = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

const ITEMS = [
  { id: "1", title: "Item One", meta: "$24.95", href: "#" },
  { id: "2", title: "Item Two", meta: "$29.00", href: "#" },
  { id: "3", title: "Item Three", meta: "$18.50", href: "#" },
  { id: "4", title: "Item Four", meta: "$22.00", href: "#" },
  { id: "5", title: "Item Five", meta: "$27.99", href: "#" },
  { id: "6", title: "Item Six", meta: "$16.95", href: "#" },
  { id: "7", title: "Item Seven", meta: "$25.50", href: "#" },
  { id: "8", title: "Item Eight", meta: "$34.00", href: "#" },
];
```

## Acceptance Checks
- Structure:
  - A visible heading is present.
  - The row uses `ul` / `li` semantics.
  - Each item is a single link wrapping its content.
- Accessible naming:
  - Each link exposes a programmatic name that includes the visible title.
  - If metadata is present, it contributes to the accessible name.
  - Each link exposes position context (e.g., “3 of 18”) once via `aria-describedby`.
- Keyboard:
  - Tab order reaches Previous and Next buttons without forcing navigation through hidden items.
  - Activating Next moves focus to the first newly visible item.
  - Activating Previous moves focus to the last newly visible item.
  - Tabbing from the last visible item moves to the Next button (not to hidden items).
- Visual focus:
  - All interactive elements (item links and paging buttons) have a visible focus indicator.
