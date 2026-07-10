---
id: select.native
title: Native Select
stack: web/react
status: beta
latest_version: 0.1.0
tags: [select, native-select, form, form-control, dropdown, picker]
aliases: [native select, html select, select element, dropdown, form select, single-select, option picker, select box]
summary: A native select element styled with CSS, the default single-value form control; retains native keyboard, mobile, dismissal, and assistive-technology behavior.
---

# Native Select

Pattern ID: `select.native`

A native `<select>` element styled with CSS, the default single-value form control; retains native keyboard, mobile, dismissal, and assistive-technology behavior.

This is the first-choice control for single selection. Reach for a custom `select.basic` only when the native element cannot meet a hard requirement.

## Use When
- Use when a form field selects one value from a preset list of plain-text options (e.g., "Sort by", "Country", "Subscription plan").
- Use when native keyboard support, mobile pickers, dismissal, form submission, and assistive-technology support are wanted without re-implementation.
- Use when single selection is needed and no requirement forces a custom widget (this is the default choice).

## Do Not Use When
- Do not use when the option list needs rich or interactive content the native control cannot render (use `select.basic`).
- Do not use when the user must type to filter a large list (use `combobox.autocomplete`).
- Do not use when multiple selection is required (use `listbox.basic`; a checkbox group is often better).
- Do not use when the control performs actions rather than choosing a value (use `menu.basic`).

## Must Haves
- Use a native `<select>` element with native `<option>` elements.
- Provide a visible label associated with the `<select>` via a native `<label>` using `for`/`id`.
- The `<select>` participates in the form via a `name` attribute, and uses native attributes (`required`, `disabled`) as needed.
- Keep option content as plain text.
- Style the control with CSS only (`appearance` and related properties).
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the `<select>` control.

## Customizable
- The modern customizable-select CSS (`appearance: base-select` with the picker pseudo-elements and the `:open` state) may be used where browser support allows, with the classic approach of styling only the closed control as the fallback where support is absent.
- `<optgroup>` may be used to group related options under visible group labels.
- The arrow indicator styling is at the engineer's discretion as long as the control keeps its 3:1 non-text contrast and native behavior.

## Don'ts
- Do not rebuild the select with `<div>` elements and scripting when a native `<select>` suffices.
- Do not remove the native element in favor of a custom widget for styling reasons alone.
- Do not replace native behavior with scripting.
- Do not use the `multiple` attribute (native multi-select tests very poorly).
- Do not hide the label.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function NativeSelectDemo() {
  const [value, setValue] = useState("trending");

  return (
    <div>
      {/* Native label associated by for/id; do not hide the label */}
      <label htmlFor="sort-order-select" style={{ display: "block" }}>
        Sort titles by
      </label>

      {/* Native select retains keyboard, mobile picker, and AT behavior.
          appearance is set for styling; when overriding the native arrow,
          supply a replacement affordance that keeps 3:1 non-text contrast. */}
      <select
        id="sort-order-select"
        name="sortOrder"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ appearance: "none" }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "trending", label: "Trending now" },
  { value: "newest", label: "Recently added" },
  { value: "az", label: "Title A to Z" },
  { value: "rating", label: "Highest rated" },
];
```

## Acceptance Checks

Keyboard
- Tab moves focus to the `<select>`, which shows a visible focus indicator.
- Type-ahead and Arrow Up/Down move through the options natively.
- Enter, Space, and Esc behave as the native control defines (opening, selecting, and dismissing).

Screen Reader
- The control is announced with its label and current value as a native select.
- Options are announced as the user moves through the list.

Form
- Submitting the form sends the selected value under the field name `sortOrder`.
