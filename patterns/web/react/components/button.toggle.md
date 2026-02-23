---
id: button.toggle
stack: web/react
status: beta
tags: [button, toggle, pressed, aria-pressed, mute-button]
aliases: [toggle button, pressed button]
summary: Two- or three-state button that toggles between pressed and not pressed using aria-pressed.
---

# Toggle Button

## Use When
- Use when a control toggles a feature or action within the current context (e.g., “Mute”, “Bold”, “Pin”, "Enable Closed Captioning").

## Do Not Use When
- Do not use when the control navigates to a new URL (use `link`).
- Do not use when the control represents a persistent on/off system or application setting, such as “Enable notifications”, “Dark mode” (use `switch`).
- Do not use when the control opens a menu (use `menu.button`).

## Must Haves
- Use a native `<button>` element for built-in semantics and keyboard behavior.
- Ensure the button has an accessible name that clearly describes its purpose or action.
- Default strategy: represent state by changing the accessible name to the next action (e.g., “Mute” ↔ “Unmute”, “Pin” ↔ “Remove pin”).
- For buttons with visible text, the button's inner text may serve as the accessible name. Additional context may be added for screen reader users with `aria-label` or `aria-labelledby`, or offscreen text, when needed.
- If the accessible name extends beyond the visible text, ensure the visible text appears at the beginning of the accessible name.
- For icon-only buttons, provide an accessible name using `aria-label` or `aria-labelledby`.
- Icons within buttons must be decorative (`aria-hidden="true"`).
- If the action is unavailable, disable the button using the native `disabled` attribute. (It becomes unfocusable and non-interactive.)
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the button.

### Formatting toolbar exception
- If the control is a formatting toggle in a toolbar (e.g., Bold/Italic/Underline), use aria-pressed="true|false" to reflect whether formatting is currently applied.
- In this toolbar case, keep the accessible name stable (e.g., “Bold”) and do not rename it to “Remove bold” or “Unbold”.

## Customizable
- For most toggles (non-toolbar), you may express “next action” via:
  - Visible text (preferred when space allows), and/or
  - `aria-label` / `aria-labelledby` (required for icon-only).
- You may add context to the accessible name when multiple similar toggles exist (e.g., “Mute Trailer”, “Unmute Trailer”) using `aria-label`, `aria-labelledby`, or offscreen text.

## Don’ts
-   Don't use `aria-pressed` for non-toolbar toggles **if** you are already changing the accessible name to the next action (avoid conflicting models like "Unmute, pressed").
- Don't leave `aria-pressed` incorrect, stale, or always `"true"` / always `"false"` when you choose the toolbar approach.
- Don't ship icon-only toggles without an accessible name (`aria-label` or `aria-labelledby`).
- Don't put state only in the icon (screen reader users must get state via the accessible name change or `aria-pressed`, depending on strategy).

## Golden Pattern
```jsx
import * as React from "react";

export function ToggleButtonDemo() {
  const [muted, setMuted] = React.useState(false);
  const [iconOnlyMuted, setIconOnlyMuted] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const [bold, setBold] = React.useState(false);

  return (
    <div>
      <p>Toggle state indicated by accessible name change</p>

      <button type="button" onClick={() => setMuted((v) => !v)}>
        <span aria-hidden="true">[icon]</span>{" "}
        {muted ? "Unmute" : "Mute"}
      </button>

      <button type="button" onClick={() => setPinned((v) => !v)}>
        <span aria-hidden="true">[icon]</span>{" "}
        {pinned ? "Unpin" : "Pin"}
      </button>

      <button
        type="button"
        onClick={() => setIconOnlyMuted((v) => !v)}
        aria-label={iconOnlyMuted ? "Unmute" : "Mute"}
      >
        <span aria-hidden="true">[icon]</span>
      </button>

      <hr />

      <p>Toggle state indicated by aria-pressed (toolbar formatting)</p>

      <button
        type="button"
        aria-pressed={bold ? "true" : "false"}
        onClick={() => setBold((v) => !v)}
      >
        <span aria-hidden="true">[icon]</span>{" "}
        Bold
      </button>
    </div>
  );
}
```

## Acceptance Checks
- Keyboard activation
  - Tab to each control: a visible focus indicator is present.
  - Press Space or Enter: the control activates/toggles.
- Either the button's accessible name adjusts to reflect its state (preferred), or it remains constant and the value of `aria-pressed` reflects its state
- Icons are not announced (decorative via `aria-hidden="true"`).
