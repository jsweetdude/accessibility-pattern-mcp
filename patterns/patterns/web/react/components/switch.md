---
id: switch.basic
stack: web/react
status: beta
tags: [switch, settings, on-off, form-control, toggle]
aliases: [toggle switch, preference toggle]
summary: Two-state on/off control representing a persistent setting. Uses role="switch" with aria-checked, or native checkbox semantics when applicable.
---

# Switch

## Use When
- Use when a control represents a persistent binary setting that remains on or off beyond the current interaction (e.g., “Enable notifications”, “Dark mode”).
- Use when the setting takes effect immediately when toggled, without requiring form submission.
- Use when the control reflects the current state of a system or application preference.

## Do Not Use When
- Do not use when the control triggers an in-place action or transient feature toggle within the current context (use `button.toggle`).
- Do not use when selecting one or more options from a group of related choices (use `checkbox`).
- Do not use when more than two states are required (use `button.toggle`).

## Must Haves
- The switch has `role="switch"`.
- The switch should have an associated visible text label.
- Ensure the switch has an accessible name that clearly describes its action. Often this is worded to be true when the switch is set to "on" (e.g., "Enable notifications").
- The accessible name should be equivalent to the visible text label. Additional context may be added for screen reader users with `aria-label` or `aria-labelledby`, or offscreen text (i.e., `.sr-only`), when needed.
  - If the accessible name extends beyond the visible text, ensure the visible text appears at the beginning of the accessible name.
- When on, the switch has `aria-checked="true"`. When off, the switch has `aria-checked="false"`.
  - If the switch is implemented as `input[type="checkbox"]`, use the native `checked` attribute instead of `aria-checked`.
- The switch must be focusable:
  - Native input (i.e., `input[type="checkbox"]`) is focusable by default.
  - Non-native elements must include `tabIndex="0"`.
- Keyboard:
  - Tab/Shift+Tab moves focus to the switch.
  - Space toggles the switch.
  - Enter toggles the switch.
    - Exception: If using native input `input[type="checkbox"]`, then only Space toggles the switch, not Enter.
- If multiple switches are presented as a labeled set:
  - Use `fieldset` with `legend`, or
  - Wrap in `role="group"` with `aria-labelledby`.
- If additional descriptive static text is relevant to a switch or switch group, associate it using `aria-describedby`.

## Customizable
- Whether the visual design resembles a sliding switch.
- Whether the accessible name is contained within the switch or referenced externally.
- Whether state text (“On”/“Off”) is visually displayed.
- Whether multiple switches may be grouped.

## Don’ts
- Don’t use a switch for non-setting actions.
- Don’t omit `aria-checked` when using `div` or `button` with `role="switch"`.
- Don’t use both `checked` and `aria-checked` on `input[type="checkbox"]`.
- Do not use a switch to trigger actions; use it only for persistent on/off settings.

## Golden Pattern

```jsx
"use client";

import * as React from "react";

export function SwitchDemo() {
  const [notifications, setNotifications] = React.useState(false);

  function toggle() {
    setNotifications((v) => !v);
  }

  return (
    <div>
      {/* 
        This example uses a <div>.
        The same pattern may also be implemented using:
        - <button role="switch">, or
        - <input type="checkbox" role="switch">
      */}

      <div
        role="switch"
        aria-checked={notifications ? "true" : "false"}
        tabIndex={0}
        aria-labelledby="sw-label"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span id="sw-label">Notifications</span>
        <span aria-hidden="true">
          {notifications ? "On" : "Off"}
        </span>
      </div>

      <fieldset>
        <legend>Playback Settings</legend>
        <p id="playback-desc">
          These settings apply to all videos.
        </p>

        <div
          role="switch"
          aria-checked="true"
          tabIndex={0}
          aria-labelledby="autoplay-label"
          aria-describedby="playback-desc"
        >
          <span id="autoplay-label">Autoplay</span>
          <span aria-hidden="true">On</span>
        </div>

        <div
          role="switch"
          aria-checked="false"
          tabIndex={0}
          aria-labelledby="captions-label"
          aria-describedby="playback-desc"
        >
          <span id="captions-label">Always show captions</span>
          <span aria-hidden="true">Off</span>
        </div>
      </fieldset>
    </div>
  );
}
```

## Acceptance Checks

- Keyboard
  - Tab moves focus to each switch.
  - Space toggles state.
  - Enter toggles state.
  - Focus remains on the switch after toggling.
- Screen Reader
  - Switch is announced with its accessible name and role (“switch”).
  - State is announced correctly as on/off.
  - Group label is announced when using `fieldset/legend` or `role="group"`.
  - Additional descriptive text is announced when associated via `aria-describedby`.
