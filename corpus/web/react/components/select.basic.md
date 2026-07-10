---
id: select.basic
title: Select
stack: web/react
status: beta
latest_version: 0.2.0
tags: [select, form, form-select, listbox, dropdown]
aliases: [form select, styled select, listbox select, dropdown select]
summary: A custom-styled form select that matches native <select> behavior using a button trigger + listbox popup, and a visually hidden native <select> for form submission and browser autofill.
---

# Select

Pattern ID: `select.basic`

A custom-styled form select that matches native `<select>` behavior using a button trigger + listbox popup, and a visually hidden native `<select>` for form submission and browser autofill.

Native `<select>` elements are accessible out of the box. This pattern applies only when building a **custom-styled** select input.

## Use When
- Use when a form input must allow selecting **one option** from a predefined set.
- Use when the options are short labels and the selection is discrete (not freeform text).
- Use for primary or secondary forms anywhere on a site or application.

## Do Not Use When
- Do not use when a native `<select>` styled with CSS meets the need (use `select.native`).
- Do not use when the user needs to type to filter a large list (use `combobox.autocomplete`).
- Do not use when multiple selections are required (use `listbox.basic`).
- Do not use for navigation menus or account menus (use `navigation-menu.basic` or `navigation-menu.dropdown`).

## Must Haves
- Provide a visible label for the field. Prefer a native `<label>` and ensure the custom UI is programmatically associated with the label (see `aria-labelledby` below).
- Include a **visually hidden native `<select>`** (required).
  - The hidden `<select>` includes the same options and current value as the custom UI.
  - The hidden `<select>` includes form attributes as needed (e.g., `name`, `required`, `disabled`).
  - The hidden `<select>` is not focusable (so users don't tab to both controls).
- The visible interactive control is a native `<button>` (preferred) or `role="button"` only when a native button cannot be used.
  - If using `role="button"`, add `tabindex="0"` and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating.
- The button must expose "opens a listbox" semantics and state:
  - `aria-haspopup="listbox"`
  - `aria-expanded="true|false"` reflecting open/closed
  - `aria-controls="IDREF"` pointing to the listbox element
- The button must have an accessible name that includes the field label and current value.
  - Recommended: `aria-labelledby="{labelId} {valueId}"` where:
    - `labelId` references the label element
    - `valueId` references an element containing the currently selected value text
- The popup must use listbox semantics:
  - The popup contains one element with `role="listbox"` and a stable ID (the same one referenced by `aria-controls`).
  - Each option uses `role="option"` and has a stable ID.
  - Each option exposes selection with `aria-selected="true|false"`.
- When the listbox is open, the "currently active" option is programmatically indicated (recommended).
  - Preferred approach: keep focus on the button and set `aria-activedescendant="{optionId}"` on the button to point to the active option.
- The listbox must be shown/hidden in the DOM so that when closed it cannot be reached by keyboard or screen readers (e.g., via `hidden`).
- Keyboard UX must match native `<select>` expectations:
  - Tab / Shift+Tab moves focus to/from the button like a normal form field (no focus trap).
  - Enter or Space on the button opens the listbox.
  - When open:
    - Arrow Up/Down moves the active option.
    - Enter or Space selects the active option and closes the listbox.
    - Esc closes the listbox and returns the user to the button state.
  - Clicking/tapping outside closes the listbox.
- Screen reader UX must match native `<select>` expectations:
  - The label and current value are announced together (via `aria-labelledby`).
  - Expanded/collapsed state is announced (via `aria-expanded`).
  - The user can perceive which option is selected (`aria-selected`).
  - The user can perceive which option is currently active when navigating (`aria-activedescendant` recommended).
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the button that opens the select, and all option elements inside.

## Customizable
- Whether Arrow Up/Down changes selection while closed vs opens then moves active option.
  - Choose one behavior and test with keyboard + screen readers.
- Whether the listbox closes immediately after selection (usually yes for single-select).
- Visual styling (caret icon, borders, spacing, animation), as long as it does not replace accessible naming.
- Optional grouping or separators, as long as listbox/option semantics remain correct and options remain navigable.

## Don'ts
- Do not omit the visually hidden native `<select>` when this control participates in form submission or should support autofill.
- Do not implement the trigger as a non-interactive element (e.g., `<div>`) without button semantics.
- Do not use `role="menu"` / `role="menuitem"` for select options.
- Do not make each option tabbable (avoid forcing users to Tab through options).
- Do not leave the listbox visible while `aria-expanded="false"` (and vice versa).
- Do not allow the custom UI and hidden `<select>` to get out of sync (options/value must match).

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

const OPTIONS = [
  { value: "red", label: "Red" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
];

// Visually-hidden styles matching the global sr-only utility (global.sr-only).
const srOnlySelectStyle = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function CustomSelectBasic() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("red");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef(null);
  const btnRef = useRef(null);

  const labelId = "color-select-label";
  const valueId = "color-select-value";
  const listboxId = "color-select-listbox";
  const nativeId = "color-select-native";

  const selectedIndex = useMemo(
    () => Math.max(0, OPTIONS.findIndex((o) => o.value === value)),
    [value],
  );

  const selected = OPTIONS[selectedIndex];

  function openListbox() {
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function closeListbox() {
    setOpen(false);
  }

  function chooseIndex(idx) {
    const opt = OPTIONS[idx];
    if (!opt) return;
    setValue(opt.value);
    setActiveIndex(idx);
    closeListbox();
    requestAnimationFrame(() => btnRef.current?.focus());
  }

  // Close on outside click.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e) {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) closeListbox();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close when tabbing away (no focus trap).
  function onBlurCapture(e) {
    if (!open) return;
    const root = rootRef.current;
    const next = e.relatedTarget;
    if (!root || !next) return;
    if (!root.contains(next)) closeListbox();
  }

  function moveActive(delta) {
    setActiveIndex((i) => {
      const next = Math.max(0, Math.min(OPTIONS.length - 1, i + delta));
      return next;
    });
  }

  function onTriggerClick() {
    if (open) closeListbox();
    else openListbox();
  }

  function onTriggerKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openListbox();
        moveActive(+1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openListbox();
        moveActive(-1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openListbox();
        else chooseIndex(activeIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeListbox();
        }
        break;
      default:
        break;
    }
  }

  return (
    <div
      ref={rootRef}
      onBlurCapture={onBlurCapture}
      style={{ display: "inline-block", position: "relative" }}
    >
      <label id={labelId} htmlFor={nativeId} style={{ display: "block" }}>
        Favorite color
      </label>

      {/* Visually hidden native select (required for forms/autofill) */}
      <select
        id={nativeId}
        name="favoriteColor"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={srOnlySelectStyle}
        aria-hidden="true"
        tabIndex={-1}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-controls={listboxId}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-activedescendant={open ? `${listboxId}-opt-${activeIndex}` : undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <span id={valueId}>{selected.label}</span>
        <span aria-hidden="true">▼</span>
      </button>

      <ul
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        hidden={!open}
        style={{
          position: "absolute",
          zIndex: 10,
          top: "calc(100% + 0.25rem)",
          left: 0,
          listStyle: "none",
          margin: 0,
          padding: 4,
          border: "1px solid #ccc",
          background: "white",
          maxHeight: 160,
          overflow: "auto",
        }}
      >
        {OPTIONS.map((opt, idx) => {
          const isSelected = opt.value === value;
          const isActive = idx === activeIndex;

          return (
            <li
              key={opt.value}
              id={`${listboxId}-opt-${idx}`}
              role="option"
              aria-selected={isSelected ? "true" : "false"}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => e.preventDefault()} // keep focus on button
              onClick={() => chooseIndex(idx)}
              style={{
                padding: "6px 8px",
                cursor: "default",
                outline: isActive ? "2px solid #888" : "none",
              }}
            >
              {opt.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

## Acceptance Checks

Keyboard
- Tab focuses the trigger button; Shift+Tab moves away normally.
- Enter or Space on the trigger opens the listbox.
- When open, Arrow Up/Down moves the active option.
- Enter or Space selects the active option and closes the listbox.
- Esc closes the listbox and leaves focus on the trigger.
- Tab does not move through every option (no focus trap / no tabbing each option).

Screen Reader
- The trigger is announced with "has popup" and expanded/collapsed state (from aria-haspopup="listbox" + aria-expanded).
- The listbox is announced as a listbox, and options are announced as options.
- The selected option is conveyed via aria-selected="true".
- The active option is conveyed while navigating (e.g., via aria-activedescendant).