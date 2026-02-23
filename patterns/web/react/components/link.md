---
id: link.basic
stack: web/react
status: beta
tags: [link, anchor, navigation, external-link]
aliases: [anchor, hyperlink, external link]
summary: Native link for navigation using <a href>. Supports optional context in the accessible name, including “opens in new tab/window/dialog”.
---

# Link

## Use When
- Use when activating the element navigates to a different URL, route, or in-page anchor.
- Use when the primary purpose of the element is destination-based navigation rather than performing an action.

## Do Not Use When
- Do not use when activating the element performs an in-place action such as submitting, saving, deleting, toggling, or opening a dialog (use `button`).
- Do not use when the element changes UI state without navigation (use `button`).

## Must Haves
- Use a native `<a>` element with an `href` whenever possible.
- Ensure the link’s purpose/destination is understandable from the link text alone, or from the link text plus programmatically determined context (e.g., `aria-label`, `aria-labelledby`, offscreen text).
- Ensure the link has an accessible name that describes its purpose/destination.
- For links with visible text, the inner text may serve as the accessible name. Additional context may be added using `aria-label`, `aria-labelledby`, or offscreen text when needed.
- If the accessible name extends beyond the visible text, ensure the visible text appears at the beginning of the accessible name.
- For icon-only links, provide an accessible name using `aria-label` or `aria-labelledby`.
- Icons within links must be decorative (`aria-hidden="true"`).
- Keyboard activation must follow native link behavior: Enter activates; Space does not.
- Ensure the link is focusable:
  - Preferred: provide `href` (native focus + native behaviors).
  - If using `role="link"` on a non-`<a>` element, you must also provide keyboard support and focus management (e.g., `tabIndex="0"` and Enter key activation).
- If a link opens a new tab/window, include both:
  - programmatic context in the accessible name (e.g., “opens in new tab”), and
  - a visual affordance: append an external-link icon at the end of the visible label.
 - Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the link.

## Customizable
- Links with visible text don't usually need additional context for screen reader users (though they might). If they do, then an `aria-label` or offscreen element should be used.

## Don’ts
- Don’t style a link to look like plain text when it appears inline within a paragraph; inline links must be visually obvious (e.g., underlined).
- Don’t rely on color alone to indicate a link.
- Don’t use `<a>` without `href` for interactive behavior; it loses native link semantics and behaviors.
- Do not use `role="link"` on non-link elements unless you cannot use a native `<a href>`. Native links provide browser behaviors ARIA cannot add automatically.
  - Don’t use `role="link"` unless you also implement the missing link behaviors (focus, Enter activation, navigation, and expected link affordances).
- Don’t permit Space to activate links.

## Golden Pattern
```jsx
import * as React from "react";

export function LinkDemo() {
  return (
    <div>
      {/* Simple link: accessible name from visible text */}
      <a href="/account">Sign in</a>

      <br />

      {/* Add context when needed (e.g., repeated links) */}
      <h3 id="prod-1">Superflo Water Bottle</h3>
      <a href="/products/1" aria-labelledby="prod-1-link prod-1">
        <span id="prod-1-link">Read more</span>
      </a>

      <br />

      {/* Opens in new tab: add accessible context + visible external icon */}
      <a
        href="https://example.com/report.pdf"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download report, opens in a new tab"
      >
        Download report <span aria-hidden="true">[external-link-icon]</span>
      </a>

      <br />

      {/* Icon-only link: must provide an accessible name */}
      <a href="/settings" aria-label="Settings">
        <span aria-hidden="true">[icon]</span>
      </a>
    </div>
  );
}
```

## Acceptance Checks
- Tab to each link: link receives focus and has a visible focus indicator.
- Press Enter on a focused link: navigation is triggered.
- Press Space on a focused link: does not activate the link.
- Inline link in body text is visually identifiable as a link (e.g., underlined).
- Screen reader announces an understandable name for each link:
  - Simple link: reads the visible text.
  - Contextual link: includes the additional context (e.g., “Superflo Water Bottle Read more”).
  - New tab/window link: includes “opens in a new tab/window” in the accessible name, and the external-link icon is not announced.
  - Icon-only link: announces the `aria-label`.
