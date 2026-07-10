---
id: menu.basic
title: Menu
stack: web/react
status: beta
latest_version: 0.1.0
tags: [menu, actions-menu, roving-tabindex, overflow-menu, kebab-menu, commands]
aliases: [kebab menu, overflow menu, actions menu, three-dot menu, more menu, menu button, context menu button, command menu]
summary: A button that opens a menu of commands using role='menu' and role='menuitem', with roving tabindex focus management and the full menu keyboard contract.
---

# Menu

Pattern ID: `menu.basic`

A button that opens a menu of commands using `role="menu"` and `role="menuitem"`, with roving tabindex focus management and the full menu keyboard contract.

`role="menu"` is a commitment to implement the entire menu keyboard contract below. A partially implemented menu is worse than a plain list of buttons, so use this pattern only when every requirement in Must Haves is met.

## Use When
- Use when a button reveals a set of in-place commands or actions (e.g., "Rename", "Duplicate", "Delete", "Export").
- Use when a button exposes an overflow ("...") or kebab action menu on a toolbar, card, or table row.
- Use when the items perform actions in place, not navigation to a URL.
- Use when you will implement the full menu keyboard contract (roving tabindex, Arrow keys, Home/End, type-ahead, Esc).

## Do Not Use When
- Do not use when the items are links or navigate to a URL (use `navigation-menu.dropdown`, or for a primary navigation bar use `navigation-menu.basic`).
- Do not use when the user picks a value to submit in a form (use `select.native`, or for type-to-filter selection use `combobox.autocomplete`).
- Do not use when the trigger shows and hides arbitrary content rather than a list of commands (use `disclosure.basic`).
- Do not use when building a persistent application command bar with horizontal top-level items (use `menu.menubar`).

## Must Haves

### Roles & structure
- Use a native `<button>` (preferred), or `role="button"` only when a native button cannot be used.
  - If `role="button"` is used instead of a native `<button>`, add `tabindex="0"` and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating the control.
- The menu container has `role="menu"`.
- Each command uses `role="menuitem"`.
  - A stateful item that toggles in place uses `role="menuitemcheckbox"` or `role="menuitemradio"` with `aria-checked="true|false"`.
- Dividers between groups of items use `role="separator"`.
- The menu contains only menu parts (`menuitem`, `menuitemcheckbox`, `menuitemradio`, `separator`, and grouping wrappers with `role="none"`), with no links, headings, or form inputs.

### Accessible name
- The trigger has an accessible name that describes its purpose or action.
  - For an icon-only trigger, provide an accessible name using `aria-label` or `aria-labelledby` (e.g., "More actions").
  - Icons within the trigger must be decorative (`aria-hidden="true"`).
- The menu container has an accessible name via `aria-labelledby` referencing the trigger, or via `aria-label`.

### State & properties
- The trigger has `aria-haspopup="menu"`.
- The trigger has `aria-expanded="true|false"` reflecting the open or closed state of the menu.
- The trigger has `aria-controls="IDREF"` pointing to the menu container.
- The menu is shown/hidden in the DOM (e.g., via the `hidden` attribute), so that when closed, its items cannot be reached by keyboard or screen readers.

### Keyboard
- On the trigger, Enter, Space, and Arrow Down open the menu and move focus to the first item.
- On the trigger, Arrow Up opens the menu and moves focus to the last item.
- Within the menu, Arrow Up and Arrow Down move focus between items and wrap at the ends.
- Within the menu, Home moves focus to the first item and End moves focus to the last item.
- Within the menu, Enter or Space activates the focused item, then closes the menu and returns focus to the trigger.
- Within the menu, a printable character moves focus to the next item whose label starts with that character (type-ahead).

### Focus
- Focus is managed with roving tabindex: the active item has `tabindex="0"` and all other items have `tabindex="-1"`.
- The active item receives DOM focus via `element.focus()`.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the trigger and the menu items.
- Focus returns to the trigger when the menu closes via activation or Esc, deferred with `requestAnimationFrame` so the trigger is focusable when the call runs.

### Dismissal
- Esc closes the menu and returns focus to the trigger.
- Tab moves focus out of the menu and closes it.
- An outside click or focus loss closes the menu.

## Customizable
- Roving tabindex is the default focus model. `aria-activedescendant` on the menu container is an acceptable alternative when DOM focus must remain on a single owner element. It has weaker screen-reader support, and the active-item visual style must be painted manually because no element holds DOM focus.
- Items that toggle a setting in place may use `role="menuitemcheckbox"` or `role="menuitemradio"` with `aria-checked` instead of `role="menuitem"`.
- Submenus may be supported: Arrow Right on a parent item opens its submenu and Arrow Left closes the submenu and returns focus to the parent item.

## Don'ts
- Do not use `role="menu"` for navigation or for items that are links.
- Do not place links, headings, form inputs, or arbitrary content inside a `role="menu"` container.
- Do not declare `role="menu"` without implementing the full keyboard contract (roving tabindex, Arrow keys, Home/End, type-ahead, Esc).
- Do not forget to return focus to the trigger when the menu closes via activation or Esc.
- Do not leave the menu visible while `aria-expanded="false"` (and vice versa).
- Do not reach for `aria-activedescendant` when roving tabindex is simpler for the case at hand.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function MenuButton({ label = "Actions", items = DEFAULT_ITEMS }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;

  // Roving tabindex: move DOM focus to the active item whenever the menu is open.
  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openMenu(index) {
    setActiveIndex(index);
    setOpen(true);
  }

  function closeToTrigger() {
    setOpen(false);
    // Defer focus until the menu has left the tab order and the trigger is focusable again.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function activate(index) {
    items[index]?.onSelect?.();
    closeToTrigger();
  }

  // Close on outside click without stealing focus back to the trigger.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event) {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      if (trigger.contains(event.target) || menu.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on focus loss: if focus leaves both the trigger and the menu, close without
  // pulling focus back, so Tab and programmatic focus moves out of the menu dismiss it.
  function onMenuBlur(event) {
    const next = event.relatedTarget;
    if (next && (triggerRef.current?.contains(next) || menuRef.current?.contains(next))) return;
    setOpen(false);
  }

  function onTriggerKeyDown(event) {
    switch (event.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
        event.preventDefault();
        openMenu(0);
        break;
      case "ArrowUp":
        event.preventDefault();
        openMenu(items.length - 1);
        break;
      default:
        break;
    }
  }

  function onMenuKeyDown(event) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length); // wraps at the end
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length); // wraps at the start
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        activate(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        closeToTrigger();
        break;
      case "Tab":
        // Tab moves focus out of the menu; let it proceed naturally and close.
        setOpen(false);
        break;
      default:
        // Type-ahead: jump to the next item whose label starts with the typed character.
        if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
          const query = event.key.toLowerCase();
          for (let offset = 1; offset <= items.length; offset++) {
            const idx = (activeIndex + offset) % items.length;
            if (items[idx].label.toLowerCase().startsWith(query)) {
              setActiveIndex(idx);
              break;
            }
          }
        }
        break;
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        aria-controls={menuId}
        onClick={() => (open ? setOpen(false) : openMenu(0))}
        onKeyDown={onTriggerKeyDown}
      >
        {label}
        <span aria-hidden="true"> ⋯</span>
      </button>

      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-labelledby={triggerId}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        onBlur={onMenuBlur}
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          listStyle: "none",
          margin: 0,
          padding: 4,
          border: "1px solid GrayText", // opaque, bounded overlay (system color, not decorative)
          background: "Canvas",
        }}
      >
        {items.map((item, idx) => (
          <li
            key={item.id}
            role="menuitem"
            tabIndex={idx === activeIndex ? 0 : -1}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            onClick={() => activate(idx)}
            style={{ padding: "6px 8px", cursor: "default" }}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const DEFAULT_ITEMS = [
  { id: "rename", label: "Rename", onSelect: () => alert("Rename") },
  { id: "duplicate", label: "Duplicate", onSelect: () => alert("Duplicate") },
  { id: "export", label: "Export", onSelect: () => alert("Export") },
  { id: "delete", label: "Delete", onSelect: () => alert("Delete") },
];
```

## Acceptance Checks

Keyboard
- Enter, Space, or Arrow Down on the trigger opens the menu and focuses the first item.
- Arrow Up on the trigger opens the menu and focuses the last item.
- Arrow Up and Arrow Down move focus between items and wrap at the ends.
- Home focuses the first item and End focuses the last item.
- Typing a printable character moves focus to the next item whose label starts with that character.
- Enter or Space activates the focused item, closes the menu, and returns focus to the trigger.
- Esc closes the menu and returns focus to the trigger.
- Tab closes the menu and moves focus out of it.
- A click outside the trigger and menu closes the menu.

Screen Reader
- The trigger exposes a menu popup and its expanded or collapsed state (from `aria-haspopup="menu"` and `aria-expanded`).
- The container is announced as a menu with its accessible name.
- Items are announced as menu items, and stateful items convey their checked state via `aria-checked`.
- Closed menus are not reachable.
