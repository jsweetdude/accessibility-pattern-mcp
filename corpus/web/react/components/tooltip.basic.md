---
id: tooltip.basic
title: Tooltip
stack: web/react
status: beta
latest_version: 0.1.0
tags: [tooltip, aria-describedby, hover, focus, supplementary-label]
aliases: [tooltip, hint, help bubble, info bubble, hover text, popup label, title text, describedby]
summary: A brief supplementary text label shown on hover and focus of its trigger; uses role="tooltip" referenced by aria-describedby, and is hoverable, dismissible, and persistent.
---

# Tooltip

Pattern ID: `tooltip.basic`

A brief supplementary text label shown on hover and focus of its trigger; uses `role="tooltip"` referenced by `aria-describedby`, and is hoverable, dismissible, and persistent.

## Use When

- Use when a brief plain-text label supplements a control (e.g., clarifying an icon-only button, a short hint on a form field).
- Use when the content is non-essential supplementary text.
- Use when the label should appear on both pointer hover and keyboard focus of the trigger.

## Do Not Use When

- Do not use when the content is interactive or rich, containing links or buttons (use `dialog.nonmodal`).
- Do not use when the content is a status or confirmation message (use `toast.basic`).
- Do not use when the label would be the control's only accessible name; give the control a real accessible name via a visible label or `aria-label` instead (use `button.basic`).
- Do not use when the content is a menu of choices (use `menu.basic`).

## Must Haves

- The tooltip bubble is an element with `role="tooltip"` and a stable `id`.
- The trigger references the tooltip with `aria-describedby` pointing to the tooltip's `id`.
  - The tooltip supplements the accessible name, it does not replace it. The trigger has its own accessible name (e.g., visible text or `aria-label`).
- The tooltip appears on both pointer hover and keyboard focus of the trigger.
- Esc dismisses the tooltip whether it was opened by pointer hover or by keyboard focus, and does not move pointer hover or keyboard focus (dismissible).
  - Bind the Esc handler at the document level, not only on the trigger, so it works when the tooltip is shown by hover and the trigger does not hold focus.
  - When the trigger has keyboard focus, the trigger keeps focus after dismissal.
- The tooltip remains visible while the pointer is over the trigger or over the tooltip, and while the trigger has focus (hoverable and persistent).
  - Track hover and focus as independent conditions and keep the tooltip open while either is active, so a stray pointer movement does not hide it while the trigger still has keyboard focus.
- The tooltip is not focusable and contains plain text only, with no interactive content.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the trigger.

## Customizable

- `aria-describedby` associates the tooltip as a supplementary description. When the tooltip text is intended to be the control's accessible name (rare), `aria-labelledby` may be used instead of `aria-describedby`.
- Positioning relative to the trigger and an optional show delay are at the engineer's discretion, as long as the tooltip remains hoverable, dismissible, and persistent.
- The tooltip may be delivered via scripting or via the native `popover` attribute.

## Don'ts

- Do not place interactive content (links, buttons, form controls) in a tooltip.
- Do not rely on the native `title` attribute as the tooltip; it is not keyboard-accessible and is announced inconsistently.
- Do not make the tooltip vanish when the pointer moves from the trigger toward the tooltip; it must be hoverable.
- Do not show the tooltip on hover only; it must also appear on keyboard focus.
- Do not hide the tooltip on `onMouseLeave` while the trigger still has keyboard focus; hover and focus must be tracked independently.
- Do not use `role="menu"` on the tooltip.
- Do not leave the tooltip visible after the trigger has lost focus and the pointer has left both the trigger and the tooltip.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function TooltipDemo() {
  // Hover and focus are tracked as independent conditions. The tooltip stays
  // open while either is active (persistent), so a stray pointer movement
  // cannot hide it while the trigger still holds keyboard focus.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = hovered || focused;
  const tooltipId = "tooltip-watchlist";

  // Dismissible (WCAG 1.4.13): Esc closes the tooltip without moving pointer
  // hover or keyboard focus. The listener is on the document, not the trigger,
  // because a hover-only tooltip has no focused element to receive the keydown.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setHovered(false);
        setFocused(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    // Wrapping the trigger and the bubble in one hover region keeps the tooltip
    // open while the pointer moves from the trigger onto the bubble (hoverable).
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* The trigger carries its own accessible name; the tooltip only supplements it. */}
      <button
        type="button"
        aria-label="Add to watchlist"
        aria-describedby={tooltipId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={() => alert("Added to watchlist")}
      >
        <span aria-hidden="true">[icon]</span>
      </button>

      {/* Plain-text bubble, not focusable, referenced by aria-describedby. */}
      {open && (
        <span
          role="tooltip"
          id={tooltipId}
          style={{ position: "absolute", top: "100%", left: 0 }}
        >
          Adds this title to your watchlist.
        </span>
      )}
    </span>
  );
}
```

## Acceptance Checks

- Keyboard
  - A visible focus indicator is present on the trigger when reached by keyboard.
  - Focusing the trigger shows the tooltip.
  - Esc dismisses the tooltip while focus stays on the trigger.
  - A stray pointer movement over and off the trigger does not hide the tooltip while the trigger still has focus.
- Pointer
  - Hovering the trigger shows the tooltip.
  - The pointer can move onto the tooltip without dismissing it.
  - Pressing Esc while the tooltip is shown by hover dismisses it without moving the pointer.
- Screen Reader
  - The tooltip text is announced as the trigger's description via `aria-describedby`.
