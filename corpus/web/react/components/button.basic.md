---
id: button.basic
title: Basic Button
stack: web/react
status: beta
latest_version: 0.2.1
tags: [button, control, action, icon-button]
aliases: [btn, primary button, icon button, call to action, cta]
summary: Native button that triggers an action. Supports text-only, icon+text, and icon-only labeling patterns.
---

# Basic Button

Pattern ID: `button.basic`

Native button that triggers an action. Supports text-only, icon+text, and icon-only labeling patterns.

## Use When
- Use when the user triggers an immediate action (e.g., "Save", "Continue", "Dismiss").

## Do Not Use When
- Do not use when the control navigates to a new URL (use `link`).
- Do not use when the control represents an on/off pressed state (use `button.toggle`).
- Do not use when the control opens a menu (use `menu.basic`).

## Must Haves
- Use a native `<button>` for built-in semantics and keyboard behavior.
  - A custom implementation with `role="button"` is appropriate only when a native button cannot be used.
  - If role="button" is used instead of a native <button>, add tabindex="0" and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating the control.
- The button has an accessible name that describes its purpose or action.
- When the button has visible text, the visible text serves as the accessible name.
- When additional context is needed beyond the visible text, add it via `aria-label`, `aria-labelledby`, or offscreen text. The visible text appears at the start of the accessible name.
- For icon-only buttons, provide an accessible name using `aria-label` or `aria-labelledby`.
- Icons within buttons must be decorative (`aria-hidden="true"`).
- If the action is unavailable, disable the button using the native `disabled` attribute. (It becomes unfocusable and non-interactive.)
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the button.

## Customizable
- No accessibility-relevant variations beyond the Must Haves above.

## Don'ts
- Do not build a button out of a `<div>` or `<span>` with `role="button"` unless you absolutely must; native `<button>` is the baseline.
- Do not create icon-only buttons without an accessible name (no unlabeled icons). 
- Do not use `aria-label` that conflicts with (or is wildly different from) the visible label text. Accessible names should at least begin with the visible label.
- Do not hide focus outlines without providing a strong custom focus style.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
export function ButtonBasicDemo() {
  return (
    <div>
      {/* Text-only */}
      <button type="button" onClick={() => alert("Saved")}>
        Save
      </button>

      {/* Icon + text */}
      <button type="button" onClick={() => alert("Downloaded")}>
        <span aria-hidden="true">[icon]</span> Download
      </button>

      {/* Icon-only (must have accessible name) */}
      <button
        type="button"
        aria-label="Open settings"
        onClick={() => alert("Settings")}
      >
        <span aria-hidden="true">[icon]</span>
      </button>

      {/* Disabled */}
      <button type="button" disabled onClick={() => alert("Won't fire")}>
        Disabled
      </button>
    </div>
  );
}
```

## Acceptance Checks
- Tab to the button: a visible focus indicator is present.
- Press Space or Enter: the button activates.
- Text-only button: screen reader announces the visible label.
- Icon+text button: screen reader announces the text label (icon is not redundantly announced).
- Icon-only button: screen reader announces the `aria-label` (e.g., "Open settings").
- Disabled button:
  - Cannot be activated by click/keyboard.
  - Is not focusable when `disabled` is set.
