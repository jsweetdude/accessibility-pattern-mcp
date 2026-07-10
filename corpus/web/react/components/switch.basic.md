---
id: switch.basic
title: Switch
stack: web/react
status: beta
latest_version: 0.3.0
tags: [switch, form, settings, on-off, form-control, toggle]
aliases: [toggle switch, preference toggle]
summary: Two-state on/off control representing a persistent setting. Uses role="switch" with aria-checked, or native checkbox semantics when applicable.
---

# Switch

Pattern ID: `switch.basic`

Two-state on/off control representing a persistent setting. Uses `role="switch"` with `aria-checked`, or native checkbox semantics when applicable.

## Use When
- Use when a control represents a persistent binary setting that remains on or off beyond the current interaction (e.g., "Enable notifications", "Dark mode").
- Use when the setting takes effect immediately when toggled, without requiring form submission.
- Use when the control reflects the current state of a system or application preference.

## Do Not Use When
- Do not use when the control triggers an in-place action or transient feature toggle within the current context (use `button.toggle`).
- Do not use when the choice is a value submitted with a form rather than a setting that takes effect immediately (use `checkbox.basic`).
- Do not use when selecting one or more options from a set of related choices (use `checkbox.group`).
- Do not use when more than two states are required (use `button.toggle`).

## Must Haves
- The switch has `role="switch"`.
- The switch has an associated visible text label.
- The switch has an accessible name that describes its action. Often this is worded to be true when the switch is set to "on" (e.g., "Enable notifications").
- The accessible name is equivalent to the visible text label.
- When additional context is needed beyond the visible text, add it via `aria-label`, `aria-labelledby`, or offscreen text (i.e., `.sr-only`). The visible text appears at the start of the accessible name.
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
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the switch control.

## Customizable
- The base element: `<div role="switch">` (as in the golden pattern), `<button role="switch">`, or `<input type="checkbox" role="switch">`. Native elements reduce the keyboard and focus wiring that must be hand-rolled.
  - A native HTML switch control (`<input type="checkbox" switch>`) is emerging in browsers (WebKit ships an implementation) and may become the preferred base once support is broad.
- Whether the visual design resembles a sliding switch.
- Whether the accessible name is contained within the switch or referenced externally.
- Whether state text ("On"/"Off") is visually displayed.
- Whether multiple switches may be grouped.

## Don'ts
- Do not use a switch for non-setting actions.
- Do not omit `aria-checked` when using `div` or `button` with `role="switch"`.
- Do not use both `checked` and `aria-checked` on `input[type="checkbox"]`.
- Do not use a switch to trigger actions; use it only for persistent on/off settings.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function SwitchDemo() {
  const [notifications, setNotifications] = useState(false);

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
  - Switch is announced with its accessible name and role ("switch").
  - State is announced correctly as on/off.
  - Group label is announced when using `fieldset/legend` or `role="group"`.
  - Additional descriptive text is announced when associated via `aria-describedby`.
