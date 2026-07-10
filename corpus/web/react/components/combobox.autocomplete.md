---
id: combobox.autocomplete
title: Autocomplete Combobox
stack: web/react
status: beta
latest_version: 0.1.0
tags: [combobox, autocomplete, listbox, filter, aria-activedescendant, form, search]
aliases: [typeahead, type-ahead, autosuggest, auto-suggest, search select, filterable dropdown, predictive input, combo box]
summary: An editable text input that filters a listbox of options as the user types; uses role="combobox" with aria-autocomplete, aria-expanded, aria-controls, and aria-activedescendant while DOM focus stays on the input.
---

# Autocomplete Combobox

Pattern ID: `combobox.autocomplete`

An editable text input that filters a listbox of options as the user types; uses `role="combobox"` with `aria-autocomplete`, `aria-expanded`, `aria-controls`, and `aria-activedescendant` while DOM focus stays on the input.

## Use When
- Use when the option set is large enough that typing to filter or search is faster than scanning a list (e.g., "Country", "City", "Assign to a user").
- Use when the user narrows the available options by typing (e.g., "Search shows", "Add a tag").
- Use when free-text entry is allowed alongside suggestions (e.g., a tag field that accepts new values while suggesting existing ones).

## Do Not Use When
- Do not use when no typing is needed and the set is small or preset (use `select.native`, or for a rich custom-styled picker use `select.basic`).
- Do not use when the options must be permanently visible with no popup (use `listbox.basic`).
- Do not use when the control performs actions rather than picking a value (use `menu.basic`).
- Do not use when the trigger reveals navigation links (use `navigation-menu.dropdown`).

## Must Haves

### Roles & structure
- Use a native `<input>` element with `role="combobox"` as the editable control.
- Set `aria-autocomplete="list"` on the input to indicate that typing filters a list of options.
- Render the popup as an element with `role="listbox"` and a stable ID (the same one referenced by `aria-controls`).
- Give each option `role="option"`, a stable ID, and `aria-selected="true|false"`.

### Accessible name
- Provide a visible native `<label>` associated with the input via `for`/`id`.

### State & properties
- Set `aria-expanded="true|false"` on the input reflecting whether the listbox is displayed.
- Set `aria-controls="IDREF"` on the input pointing to the listbox element.
- The listbox is shown/hidden in the DOM (e.g., via the `hidden` attribute), so that when closed, its options cannot be reached by keyboard or screen readers.

### Keyboard
- Arrow Down moves to the first option, opening the listbox first if it is closed.
- Arrow Up moves to the last option, opening the listbox first if it is closed.
- Alt+Arrow Down opens the listbox without moving the active option.
- When the listbox is open, Arrow Up and Arrow Down move the active option and wrap at the ends.
- Enter sets the input value to the active option and closes the listbox.
- Home, End, Left, and Right move the caret within the input text rather than the active option.
- A printable character returns focus to the input, inserts the character, and filters the listbox to matching options.
- Do not capture the keys the browser uses for text editing (character keys, caret movement, selection, and deletion).

### Focus
- Keep DOM focus on the input at all times so native text editing keeps working.
- Indicate the active option by setting `aria-activedescendant="{optionId}"` on the input, pointing to the currently highlighted option.
  - When no option is active, remove `aria-activedescendant` (do not point it at a stale or nonexistent ID).
- Scroll the active option into view via scripting when it changes so it is visible.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the input, and a distinct visual highlight on the active option.

### Dismissal
- Esc closes the listbox if it is open, or clears the input if the listbox is already closed.

## Customizable
- `aria-autocomplete` may be `"none"`, `"list"` (the default for this pattern), or `"both"`.
  - With `"both"`, an inline completion string is inserted and selected after the caret; this can be confusing with some screen readers, so test it with assistive technology before shipping.
- Selection behavior may be manual (the active option is committed only on Enter) or automatic (the first suggestion is pre-selected as the user types). Choose one and test with keyboard and screen readers.
- An optional trigger button that opens the listbox may be included; give it `tabindex="-1"` so it does not add a stop in the tab order, and keep the input as the accessible combobox.
- Whether the list filters to matches or auto-selects the first match is at the engineer's discretion, as long as the announced options reflect what is visible.

## Don'ts
- Do not capture the keys used for text editing (typing, caret movement, selection, deletion); the input must behave as a normal text field.
- Do not move DOM focus into the options; it breaks native text editing. Track the active option with `aria-activedescendant` instead.
- Do not use `role="menu"` or `role="menuitem"` for the options; use `role="listbox"` and `role="option"`.
- Do not forget to scroll the active option into view when it changes.
- Do not leave the listbox visible while `aria-expanded="false"` (and vice versa).

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function Combobox({ label = "Country", options = COUNTRIES }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const listRef = useRef(null);

  const baseId = useId();
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const optionId = (idx) => `${baseId}-opt-${idx}`;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  // Keep the active option in view whenever it changes.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector(`#${CSS.escape(optionId(activeIndex))}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function commit(idx) {
    const value = matches[idx];
    if (value == null) return;
    setQuery(value);
    closeList();
  }

  function onChange(e) {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  }

  function onKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (e.altKey) {
          openList();
          break;
        }
        // Never move the active option when there is nothing to point at,
        // or aria-activedescendant would reference a nonexistent option.
        if (matches.length === 0) {
          openList();
          break;
        }
        if (!open) {
          openList();
          setActiveIndex(0);
        } else {
          setActiveIndex((i) => (i + 1) % matches.length);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (matches.length === 0) {
          openList();
          break;
        }
        if (!open) {
          openList();
          setActiveIndex(matches.length - 1);
        } else {
          setActiveIndex((i) => (i <= 0 ? matches.length - 1 : i - 1));
        }
        break;
      case "Enter":
        if (open && activeIndex >= 0) {
          e.preventDefault();
          commit(activeIndex);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList();
        } else if (query) {
          setQuery("");
        }
        break;
      // Home, End, ArrowLeft, and ArrowRight are intentionally not handled,
      // so the browser moves the text caret as usual.
      default:
        break;
    }
  }

  const listVisible = open && matches.length > 0;
  const activeDescendant =
    listVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <label id={labelId} htmlFor={`${baseId}-input`} style={{ display: "block" }}>
        {label}
      </label>

      <input
        ref={inputRef}
        id={`${baseId}-input`}
        type="text"
        role="combobox"
        // Suppress native autofill so it does not overlay the custom listbox.
        autoComplete="off"
        aria-autocomplete="list"
        // Expanded state must track actual listbox visibility, not just intent.
        aria-expanded={listVisible ? "true" : "false"}
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        value={query}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => query && openList()}
        onBlur={(e) => {
          if (!e.currentTarget.parentNode.contains(e.relatedTarget)) closeList();
        }}
      />

      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        hidden={!listVisible}
        style={{
          position: "absolute",
          zIndex: 10,
          left: 0,
          right: 0,
          margin: 0,
          padding: 0,
          listStyle: "none",
          maxHeight: 200,
          overflow: "auto",
          border: "1px solid GrayText",
          background: "Canvas",
        }}
      >
        {matches.map((value, idx) => (
          <li
            key={value}
            id={optionId(idx)}
            role="option"
            aria-selected={idx === activeIndex ? "true" : "false"}
            // Keep DOM focus on the input; do not steal it on pointer down.
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActiveIndex(idx)}
            onClick={() => commit(idx)}
            style={{
              padding: "6px 8px",
              outline: idx === activeIndex ? "2px solid Highlight" : "none",
            }}
          >
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}

const COUNTRIES = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "France",
  "Germany",
  "India",
  "Japan",
  "Mexico",
  "Nigeria",
  "United Kingdom",
  "United States",
];
```

## Acceptance Checks

Keyboard
- Typing a character filters the listbox to matching options.
- Arrow Down and Arrow Up move the active option and wrap at the ends.
- Alt+Arrow Down opens the listbox without moving the active option.
- Enter sets the input value to the active option and closes the listbox.
- Esc closes the listbox when open, and clears the input when the listbox is already closed.
- Home, End, Left, and Right move the text caret and do not move the active option.
- Text editing (typing, selecting, and deleting) works normally while the listbox is open.

Screen Reader
- The input is announced as a combobox with its label and expanded/collapsed state (from `role="combobox"` + `aria-expanded`).
- The listbox and its options are announced as a listbox and options.
- The currently active option is conveyed as the user navigates (via `aria-activedescendant`).
