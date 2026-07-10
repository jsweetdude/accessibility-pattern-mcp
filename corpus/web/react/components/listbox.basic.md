---
id: listbox.basic
title: Listbox
stack: web/react
status: beta
latest_version: 0.1.0
tags: [listbox, roving-tabindex, aria-activedescendant, multi-select, selection, form]
aliases: [option list, select list, single-select list, multi-select list, transfer list source, inline listbox, choice list, selectable list]
summary: An always-visible list of selectable options using role="listbox" and role="option", supporting single or multiple selection with roving tabindex or aria-activedescendant.
---

# Listbox

Pattern ID: `listbox.basic`

An always-visible list of selectable options using `role="listbox"` and `role="option"`, supporting single or multiple selection with roving tabindex or `aria-activedescendant`.

This pattern is a permanently visible selection list. There is no trigger button, popup, or expand and collapse, and options carry plain content only.

## Use When
- Use when the choices are permanently visible with no popup or expansion (e.g., an inline "Playback quality" list, a settings choice shown in place).
- Use when the user selects one option or multiple options from plain-text labels (e.g., "Select genres to follow", the source column of a transfer list).

## Do Not Use When
- Do not use when a collapsed popup value picker is expected (use `select.native`, or `select.basic` for a custom-styled one).
- Do not use when the user types to filter the options (use `combobox.autocomplete`).
- Do not use when the options must contain interactive elements such as links or buttons (use `grid.basic`).
- Do not use when the user chooses among many independent on and off settings (use `checkbox.group`).
- Do not use when the control performs actions rather than holding a selection (use `menu.basic`).

## Must Haves

### Roles & structure
- The container is an element with `role="listbox"` and an accessible name via `aria-label` or `aria-labelledby`.
- Each option is an element with `role="option"` and `aria-selected="true|false"`.
- Options contain no interactive child elements (no links, buttons, inputs, or nested controls).

### State & properties
- For multiple selection, the listbox has `aria-multiselectable="true"`.

### Keyboard
- Arrow Down and Arrow Up move the active option to the next and previous option.
- Home and End move the active option to the first and last option.
- A printable character performs type-ahead, moving the active option to the next option whose label begins with the typed characters.
- For single-select, selection is operable from the keyboard alone.
- For multi-select, the selection is operable from the keyboard alone.
  - Space toggles `aria-selected` on the active option.
  - Shift+Arrow Up and Shift+Arrow Down extend the selection to the adjacent option.
  - Ctrl+A (Cmd+A on macOS) selects all options.
  - No modifier-only click is required to select an option.

### Focus
- Manage the active option with either roving tabindex or `aria-activedescendant`, and apply one approach consistently.
  - Roving tabindex: the focused option has `tabindex="0"` and all other options have `tabindex="-1"`.
  - `aria-activedescendant`: the `role="listbox"` element has `tabindex="0"` and its `aria-activedescendant` references the active option's ID.
- Scripting keeps the active option scrolled into view.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the active option.

## Customizable
- Roving tabindex and `aria-activedescendant` are equal alternatives. Choose one and apply it consistently.
- For single-select, selection may follow focus (each Arrow move updates `aria-selected`) or require an explicit Enter or Space to commit. Selection-follows-focus suits short lists where each change is inexpensive; explicit selection suits lists where moving through options should not trigger side effects.
- The multi-select keyboard model above (Space to toggle, Shift+Arrow to extend, Ctrl+A to select all) may be extended with Shift+Home, Shift+End, and Ctrl+Space, provided Space toggle and Arrow navigation remain intact.

## Don'ts
- Do not place interactive elements (links, buttons, checkboxes, inputs) inside `role="option"` elements.
- Do not require Ctrl or Cmd plus click as the only way to select multiple options.
- Do not use `role="menu"` or `role="menuitem"` for a selection list.
- Do not leave `aria-selected` out of sync with the visible selection state.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

function Listbox({ label, options, multiple = false }) {
  const optionRefs = useRef([]);
  const typeahead = useRef({ query: "", timer: null });
  const [activeIndex, setActiveIndex] = useState(0);
  const [selected, setSelected] = useState(() => (multiple ? new Set() : null));
  const [hasFocus, setHasFocus] = useState(false);

  const labelId = useId();

  function isSelected(value) {
    return multiple ? selected.has(value) : selected === value;
  }

  function toggleAt(index) {
    const { value } = options[index];
    if (multiple) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });
    } else {
      setSelected(value);
    }
  }

  function focusOption(index) {
    setActiveIndex(index);
    // Roving tabindex: move DOM focus to the newly active option.
    optionRefs.current[index]?.focus();
  }

  // Type-ahead: accumulate typed characters briefly, then jump to the
  // first option whose label matches, so a keyboard user can reach a
  // distant option without arrowing through every one.
  function typeAhead(char) {
    const state = typeahead.current;
    clearTimeout(state.timer);
    state.query += char.toLowerCase();
    state.timer = setTimeout(() => {
      state.query = "";
    }, 500);
    const match = options.findIndex((opt) =>
      opt.label.toLowerCase().startsWith(state.query)
    );
    if (match >= 0) focusOption(match);
  }

  function onKeyDown(e) {
    const last = options.length - 1;
    let next = activeIndex;

    switch (e.key) {
      case "ArrowDown":
        next = Math.min(last, activeIndex + 1);
        break;
      case "ArrowUp":
        next = Math.max(0, activeIndex - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case " ":
        // Space toggles in multi-select and commits in single-select;
        // preventDefault stops the page from scrolling.
        e.preventDefault();
        toggleAt(activeIndex);
        return;
      case "Enter":
        // Single-select: Enter commits the active option.
        if (!multiple) toggleAt(activeIndex);
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          typeAhead(e.key);
        }
        return;
    }

    e.preventDefault();
    focusOption(next);
    // Single-select: selection follows focus.
    if (!multiple) toggleAt(next);
  }

  return (
    <div>
      <span id={labelId}>{label}</span>
      <ul
        role="listbox"
        aria-labelledby={labelId}
        aria-multiselectable={multiple ? "true" : undefined}
        onKeyDown={onKeyDown}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          border: "1px solid",
          maxHeight: 200,
          overflow: "auto",
        }}
      >
        {options.map((opt, idx) => {
          const isActive = idx === activeIndex;
          return (
            <li
              key={opt.value}
              ref={(el) => (optionRefs.current[idx] = el)}
              role="option"
              aria-selected={isSelected(opt.value) ? "true" : "false"}
              // Roving tabindex: only the active option is in the tab order.
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                focusOption(idx);
                toggleAt(idx);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                cursor: "default",
                // Focus ring keys to real DOM focus, not just active index,
                // so it disappears when the listbox is not focused.
                outline: isActive && hasFocus ? "2px solid" : "none",
                outlineOffset: 1,
              }}
            >
              {/* Selection is conveyed by aria-selected; the mark is decorative. */}
              <span aria-hidden="true" style={{ width: "1em" }}>
                {isSelected(opt.value) ? "✓" : ""}
              </span>
              {opt.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ListboxDemo() {
  return (
    <div>
      <Listbox label="Playback quality" options={QUALITY} />
      <Listbox label="Genres to follow" options={GENRES} multiple />
    </div>
  );
}

const QUALITY = [
  { value: "auto", label: "Auto" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
];

const GENRES = [
  { value: "drama", label: "Drama" },
  { value: "comedy", label: "Comedy" },
  { value: "thriller", label: "Thriller" },
  { value: "documentary", label: "Documentary" },
  { value: "sci-fi", label: "Sci-Fi" },
];
```

## Acceptance Checks

Keyboard
- Arrow Down and Arrow Up move the active option, and the active option shows a visible focus indicator.
- Home moves the active option to the first option; End moves it to the last option.
- In a multi-select listbox, Space toggles the selected state of the active option without moving focus.
- In a multi-select listbox, Shift+Arrow Up and Shift+Arrow Down extend the selection to the adjacent option.
- In a multi-select listbox, Ctrl+A (Cmd+A on macOS) selects all options.
- Typing a printable character moves the active option to the next option whose label begins with the typed characters.
- No option requires Ctrl or Cmd plus click to be selected.

Screen Reader
- The container is announced as a listbox, and as multi-selectable when `aria-multiselectable="true"` is set.
- Each option is announced as an option together with its selected state (from `aria-selected`).
- Moving the active option announces the newly active option and its selected state.
