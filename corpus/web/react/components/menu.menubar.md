---
id: menu.menubar
title: Menubar
stack: web/react
status: beta
latest_version: 0.1.0
tags: [menubar, menu, roving-tabindex, command-bar, application, keyboard-navigation]
aliases: [menu bar, application menu bar, command bar, app menu bar, editor menu bar, file edit view menu, desktop menu bar]
summary: A persistent horizontal bar of application command menus using role="menubar", role="menu", and role="menuitem", for desktop-application command surfaces only, never site navigation.
---

# Menubar

Pattern ID: `menu.menubar`

A persistent horizontal bar of application command menus using `role="menubar"`, `role="menu"`, and `role="menuitem"`, for desktop-application command surfaces only, never site navigation.

This pattern is rarely appropriate on the web. Almost every horizontal bar of links is site navigation, which must not use menu roles (use `navigation-menu.basic`). Reach for a menubar only when replicating a desktop application command bar.

## Use When
- Use when building a genuine desktop-application-style command bar that replicates an operating-system menu bar of commands (e.g., a web-based document editor, IDE, or design tool with "File", "Edit", "View").
- Use when the items are application commands, not navigation destinations (e.g., "New File", "Undo", "Toggle Sidebar").
- Use when the surface is a persistent bar of multiple always-visible top-level menus, not a single button that opens one menu (e.g., a File/Edit/View bar fixed at the top of the editor).

## Do Not Use When
- Do not use when the bar is site or app navigation of any kind, including a nav bar styled to look like a menu bar or with fly-out submenus; this is the overwhelmingly common case (use `navigation-menu.basic`).
- Do not use when a single button opens one action menu (use `menu.basic`).
- Do not use when the user picks a value from a set (use `select.native`).
- Do not use when a single trigger shows and hides a region of content (use `disclosure.basic`).

## Must Haves

### Roles & structure
- The container has `role="menubar"`.
- Horizontal orientation is implicit for `role="menubar"`; no `aria-orientation` is required.
- Only menu-related elements appear inside the menubar (top-level items, submenus, and separators). No links, no arbitrary content.
- Each top-level item has `role="menuitem"`.
- Each submenu is a container with `role="menu"` and an accessible name that matches its top-level item (e.g., `aria-label="File"`).
- Submenu commands have `role="menuitem"`, or `role="menuitemcheckbox"` or `role="menuitemradio"` for stateful commands.
- Dividers within a submenu use `role="separator"`.
- The submenu contains only menu parts (`menuitem`, `menuitemcheckbox`, `menuitemradio`, and `separator`), no links or arbitrary content.

### Accessible name
- The container has an accessible name (e.g., `aria-label="Application"`).

### State & properties
- Each top-level item that opens a submenu has `aria-haspopup="menu"` and `aria-expanded="true|false"` reflecting open/closed.
- Each submenu is shown/hidden in the DOM (e.g., via the `hidden` attribute), so that when closed, its commands cannot be reached by keyboard or screen readers.

### Keyboard
- Arrow Left and Arrow Right move focus between top-level items and wrap at the ends.
- Arrow Down, Enter, or Space on a top-level item opens its submenu and moves focus to the first submenu item.
- Within an open submenu, Arrow Up and Arrow Down move focus between commands and wrap at the ends.
- Within an open submenu, Arrow Right moves to the adjacent top-level menu, and Arrow Left moves to the previous top-level menu (opening that menu).
- Within an open submenu, Home moves focus to the first command and End moves focus to the last command.
- Enter or Space activates the focused submenu command.
- Type-ahead moves focus to the next item whose label starts with the typed character, both across top-level items and within an open submenu.

### Focus
- Focus is managed with roving tabindex across the top-level items.
  - The first top-level item starts at `tabindex="0"`; all other top-level items start at `tabindex="-1"`.
  - Moving between top-level items updates tabindex so exactly one top-level item is at `tabindex="0"` at a time.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the top-level items and submenu commands.

### Dismissal
- Esc closes the current submenu and returns focus to its top-level item.
- The menubar closes any open submenu when focus moves outside the menubar (e.g., via Tab or an outside pointer click), so no submenu stays visible while its top-level item is at `aria-expanded="false"`.

## Customizable
- Stateful commands may use `role="menuitemcheckbox"` (with `aria-checked="true|false"`) or `role="menuitemradio"` (with `aria-checked="true|false"` within a grouped set) instead of plain `role="menuitem"`.
- Roving tabindex is the default focus model. `aria-activedescendant` on the menubar is an acceptable alternative, with the caveat that its assistive-technology support is weaker than roving tabindex and it must be tested against target screen readers.
- Submenu depth is at the engineer's discretion; nested submenus are permitted as long as each nested `role="menu"` carries an accessible name and the same keyboard contract applies at every level.

## Don'ts
- Do not use a menubar for site or app navigation; a horizontal bar of links is navigation and must use `navigation-menu.basic`, not menu roles.
- Do not place links (`<a href>`) inside a menubar or its submenus; menubar children are commands, not destinations.
- Do not half-implement the keyboard contract; a menubar without arrow-key traversal, submenu open/close, and type-ahead is broken for keyboard and screen reader users.
- Do not make every top-level item and command tabbable; use roving tabindex so Tab enters and exits the menubar as a single stop.
- Do not leave a submenu visible while its top-level item has `aria-expanded="false"` (and vice versa).

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function MenubarDemo() {
  // Index of the top-level menu that currently holds roving focus.
  const [activeTop, setActiveTop] = useState(0);
  // Index of the open submenu, or null when all submenus are closed.
  const [openTop, setOpenTop] = useState(null);
  // Index of the focused command within the open submenu.
  const [activeItem, setActiveItem] = useState(0);

  const topRefs = useRef(new Map());
  const itemRefs = useRef(new Map());

  function focusTop(index) {
    setActiveTop(index);
    requestAnimationFrame(() => topRefs.current.get(index)?.focus());
  }

  function openMenu(index, itemIndex = 0) {
    setActiveTop(index);
    setOpenTop(index);
    setActiveItem(itemIndex);
    requestAnimationFrame(() => itemRefs.current.get(`${index}-${itemIndex}`)?.focus());
  }

  function closeMenu(restoreToTop = true) {
    const top = openTop;
    setOpenTop(null);
    if (restoreToTop && top != null) {
      requestAnimationFrame(() => topRefs.current.get(top)?.focus());
    }
  }

  function activate(command) {
    // Real handlers dispatch the command; alert() shows the item fires.
    alert(`Command: ${command}`);
    closeMenu();
  }

  // Type-ahead: focus the next sibling whose label starts with the typed key.
  function typeAhead(labels, current, key, onMatch) {
    const lower = key.toLowerCase();
    for (let offset = 1; offset <= labels.length; offset += 1) {
      const idx = (current + offset) % labels.length;
      if (labels[idx].toLowerCase().startsWith(lower)) {
        onMatch(idx);
        return;
      }
    }
  }

  // A single printing character with no command/system modifier is type-ahead;
  // Cmd/Ctrl/Alt combos are shortcuts and must pass through untouched.
  function isTypeAheadKey(event) {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }

  function onTopKeyDown(index, event) {
    const count = MENUS.length;
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTop((index + 1) % count);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTop((index - 1 + count) % count);
        break;
      case "ArrowDown":
      case "Enter":
      case " ":
        event.preventDefault();
        openMenu(index, 0);
        break;
      default:
        if (isTypeAheadKey(event)) {
          typeAhead(MENUS.map((m) => m.label), index, event.key, focusTop);
        }
    }
  }

  function onItemKeyDown(topIndex, itemIndex, event) {
    const items = MENUS[topIndex].items;
    const count = items.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        openMenu(topIndex, (itemIndex + 1) % count);
        break;
      case "ArrowUp":
        event.preventDefault();
        openMenu(topIndex, (itemIndex - 1 + count) % count);
        break;
      case "Home":
        event.preventDefault();
        openMenu(topIndex, 0);
        break;
      case "End":
        event.preventDefault();
        openMenu(topIndex, count - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        openMenu((topIndex + 1) % MENUS.length, 0);
        break;
      case "ArrowLeft":
        event.preventDefault();
        openMenu((topIndex - 1 + MENUS.length) % MENUS.length, 0);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        activate(items[itemIndex]);
        break;
      case "Escape":
        event.preventDefault();
        closeMenu();
        break;
      default:
        if (isTypeAheadKey(event)) {
          typeAhead(items, itemIndex, event.key, (idx) => openMenu(topIndex, idx));
        }
    }
  }

  return (
    <div
      role="menubar"
      aria-label="Editor"
      style={{ display: "flex", gap: 4 }}
      // Close the open submenu when focus leaves the menubar entirely (Tab-out
      // or outside click), so no submenu lingers with aria-expanded="false".
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          closeMenu(false);
        }
      }}
    >
      {MENUS.map((menu, topIndex) => (
        <div key={menu.id} style={{ position: "relative" }}>
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-expanded={openTop === topIndex ? "true" : "false"}
            // Roving tabindex: exactly one top-level item is tabbable.
            tabIndex={activeTop === topIndex ? 0 : -1}
            onClick={() => (openTop === topIndex ? closeMenu() : openMenu(topIndex, 0))}
            onKeyDown={(event) => onTopKeyDown(topIndex, event)}
            ref={(el) => {
              if (el) topRefs.current.set(topIndex, el);
              else topRefs.current.delete(topIndex);
            }}
          >
            {menu.label}
          </button>

          <div
            role="menu"
            aria-label={menu.label}
            hidden={openTop !== topIndex}
            style={{ position: "absolute", top: "100%", left: 0, minWidth: 160 }}
          >
            {menu.items.map((command, itemIndex) => (
              <button
                key={command}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => activate(command)}
                onKeyDown={(event) => onItemKeyDown(topIndex, itemIndex, event)}
                ref={(el) => {
                  if (el) itemRefs.current.set(`${topIndex}-${itemIndex}`, el);
                  else itemRefs.current.delete(`${topIndex}-${itemIndex}`);
                }}
                style={{ display: "block", width: "100%", textAlign: "left" }}
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const MENUS = [
  { id: "file", label: "File", items: ["New File", "Open", "Save", "Export"] },
  { id: "edit", label: "Edit", items: ["Undo", "Redo", "Cut", "Copy", "Paste"] },
  { id: "view", label: "View", items: ["Zoom In", "Zoom Out", "Toggle Sidebar"] },
];
```

## Acceptance Checks

Keyboard
- Arrow Left and Arrow Right move focus across the top-level items and wrap at the ends.
- Arrow Down, Enter, or Space on a top-level item opens its submenu and focuses the first command.
- Within an open submenu, Home focuses the first command and End focuses the last command.
- Within an open submenu, Arrow Right moves to the adjacent top-level menu and Arrow Left moves to the previous top-level menu, opening that menu.
- Esc closes the open submenu and returns focus to its top-level item.
- Enter or Space activates the focused command.
- Type-ahead moves focus to the next item whose label starts with the typed character.
- Tab enters and exits the menubar as a single stop, closing any open submenu on exit, and does not visit every top-level item and command.

Screen Reader
- The container is announced as a menu bar with its accessible name.
- Each open submenu is announced as a menu, with a name matching its top-level item.
- Top-level items and commands are announced as menu items.
- A top-level item that opens a submenu announces that it has a submenu via `aria-haspopup`, and announces its expanded or collapsed state via `aria-expanded`.
