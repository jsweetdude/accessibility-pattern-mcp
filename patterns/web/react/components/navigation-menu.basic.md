---
id: navigation-menu.basic
title: Navigation Menu
stack: web/react
status: beta
tags: [navigation, menu, disclosure, header, sitemap, flyout]
aliases: [nav dropdown, header dropdown, mega menu (simple), disclosure navigation, flyout menu]
summary: A non-modal header navigation pattern that supports top-level links and optional sub-menus. Uses disclosure-style toggles (buttons) with aria-expanded/controls and Tab-based navigation (no roving focus / no role=menu).
---

# Navigation Menu

## Use When
- Use when a website’s top-level navigation contains at least one sub-menu of links.
- Use for primary or secondary navigation regions (e.g., header nav, section nav) when the same link + sub-menu structure is needed.
- Use when the navigation structure maps to a sitemap-like set of destinations.

## Do Not Use When
- Do not use when you need application-style menubar behavior, such as arrow-key navigation, roving tabindex, typeahead (use `navigation-menu.menubar`).
- Do not use to select a value within a form (use `select.basic` or `combobox` when searchable).
- Do not use as the mobile or responsive version of a navigation menu.

## Must Haves

### Structure
- Navigation is contained within a `<nav>` landmark, or an element with `role="navigation"`, and an accessible name (`aria-label`) when multiple nav landmarks exist.
- Top-level navigation items are presented in a list structure (e.g., `<ul><li>…</li></ul>`).
- Each top-level item is one of the following:
  - (A) **Simple link**: a single `<a>` to a destination.
  - (B) **Parent link + menu button** (when the parent has its own destination page):
    - The parent is a normal `<a>` (activates navigation).
    - A separate adjacent **menu toggle button** opens/closes the sub-menu.
  - (C) **Parent button** (when the parent does not have its own destination page):
    - A `<button>` acts as the parent control and opens/closes the sub-menu.
- If the current page corresponds to a top-level item:
  - If the top-level item is a link, apply aria-current="page" to that link.
  - If the top-level item is a button-only parent (no destination), do not put aria-current on the button. Instead, apply aria-current="page" to the submenu link that represents the current page.
  - Ensure there is some visual change that indicates this is the current page link.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around all links and buttons.

### Toggle button semantics (for cases B and C)
- The toggle control is a native `<button>` (preferred) or `role="button"` only when a native button cannot be used.
  - If using `role="button"`, add `tabindex="0"` and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating.
- The toggle reflects open state with `aria-expanded="true|false"`.
- The toggle references its submenu with `aria-controls="IDREF"` (recommended).
- The toggle includes `aria-haspopup="true"` (or `aria-haspopup="menu"`).
- If the toggle is an **icon button associated with a parent link** (case B), it has an accessible name that includes the parent link text.
  - Example: `aria-label="Categories menu"` (text is customizable but must include the parent link label).
- Top-level items that open a sub-menu include a visible indicator (e.g., down caret) that communicates "has submenu."
  - The indicator is decorative and does not replace the accessible name of the toggle (e.g., use an aria-label like "Categories menu" on icon-only toggles).

### Sub-menu container
- The sub-menu container is positioned immediately after its toggle control in the DOM.
- Sub-menus all default to closed, or hidden, when the page loads.
- The sub-menu is shown/hidden in the DOM (e.g., via `hidden`) so that when closed, submenu links cannot be reached by keyboard or screen readers.
- Sub-menu items are links and/or buttons contained in a list structure (`<ul><li>…</li></ul>`).
- The sub-menu is non-modal and does not trap focus.

### Keyboard and closing behavior (disclosure-style, Tab-based)
- When a submenu is opened, focus remains on the toggle control.
  - Keyboard users reach the first submenu item with Tab.
- Users can Tab through submenu items and continue to the rest of the page (no focus trap).
- When focus moves outside the toggle + submenu (Tab away or click elsewhere), the submenu closes.
- Esc closes an open submenu and returns focus to its toggle control.
- Tab boundary behavior:
  - If focus is on the **last focusable element** in an open submenu and the user presses Tab, the submenu closes and focus moves to the next focusable element after the submenu.
  - If focus is on the **first focusable element** in an open submenu and the user presses Shift+Tab, the submenu closes and focus moves to the toggle control.

### Multi-menu coordination
- If the navigation contains multiple sub-menus, opening one closes any other open sub-menu.

## Customizable
- Whether a submenu closes when a submenu item is activated (often yes).
- Whether submenu content includes non-interactive text (e.g., “Signed in as…”) or separators.
- Positioning of submenus (left/right, below/above) provided DOM order and focus order remain logical.
- Whether the toggle is a caret icon button, text button, or combined button label (as long as the accessibility semantics above are met).

## Don’ts
- Don’t open sub-menus on hover only.
  - If hover-to-open is supported for mouse users, sub-menus must also be operable via click and keyboard, and keyboard users must not be forced to tab through submenu items unless they intentionally open them.
- Don’t make a top-level item both a navigation link and the submenu toggle using the same element.
  - If the parent has its own destination page and also has a submenu, use **parent link + separate toggle button**.
- Don’t use `role="menu"` / `role="menuitem"` unless you implement the full ARIA menu widget behavior (managed focus, arrow keys, typeahead).
- Don’t leave submenu content visible while `aria-expanded="false"` (and vice versa).
- Don’t strand focus by removing the currently focused submenu item without closing and allowing focus to move naturally.
- Don’t render sub-menus expanded/visible by default. They open only after the user activates the corresponding toggle.

## Golden Pattern
```jsx
"use client";

import * as React from "react";

export function NavigationMenuBasic() {
  const [openId, setOpenId] = React.useState(null);

  const togglesRef = React.useRef(new Map());
  const listsRef = React.useRef(new Map());

  function closeAll() {
    setOpenId(null);
  }

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  React.useEffect(() => {
    if (!openId) return;

    function onPointerDown(event) {
      const btn = togglesRef.current.get(openId);
      const list = listsRef.current.get(openId);
      if (!btn || !list) return;

      const inside = btn.contains(event.target) || list.contains(event.target);
      if (!inside) closeAll();
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openId]);

  React.useEffect(() => {
    if (!openId) return;

    function onFocusIn(event) {
      const btn = togglesRef.current.get(openId);
      const list = listsRef.current.get(openId);
      if (!btn || !list) return;

      const inside = btn.contains(event.target) || list.contains(event.target);
      if (!inside) closeAll();
    }

    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, [openId]);

  React.useEffect(() => {
    if (!openId) return;

    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();

      const btn = togglesRef.current.get(openId);
      closeAll();
      requestAnimationFrame(() => btn?.focus());
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [openId]);

  function onSubmenuKeyDown(id, event) {
    if (event.key !== "Tab") return;

    const list = listsRef.current.get(id);
    if (!list) return;

    const focusables = Array.from(
      list.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!event.shiftKey && document.activeElement === last) closeAll();
    if (event.shiftKey && document.activeElement === first) closeAll();
  }

  return (
    <nav aria-label="Primary" className="navigation-menu-basic">
      <ul style={{ listStyle: "none", paddingLeft: 0, display: "flex" }}>
        <li style={{ position: "relative" }}>
          <a href="/home" aria-current="page">Home</a>
        </li>

        <li style={{ position: "relative" }}>
          <a href="/categories">Categories</a>
          <button
            type="button"
            aria-label="Categories menu"
            aria-haspopup="true"
            aria-expanded={openId === "categories" ? "true" : "false"}
            aria-controls="nav-submenu-categories"
            onClick={() => toggle("categories")}
            ref={(el) => {
              if (el) togglesRef.current.set("categories", el);
              else togglesRef.current.delete("categories");
            }}
          >
            ▼
          </button>

          <ul
            id="nav-submenu-categories"
            aria-label="Categories"
            hidden={openId !== "categories"}
            style={{
              listStyle: "none",
              paddingLeft: 0,
              position: "absolute",
              top: "calc(100% + 0.25rem)",
              left: 0,
            }}
            onKeyDown={(event) => onSubmenuKeyDown("categories", event)}
            ref={(el) => {
              if (el) listsRef.current.set("categories", el);
              else listsRef.current.delete("categories");
            }}
          >
            <li>
              <a href="/categories/science">Science</a>
            </li>
            <li>
              <a href="/categories/arts">Arts</a>
            </li>
            <li>
              <a href="/categories/engineering">Engineering</a>
            </li>
          </ul>
        </li>

        <li style={{ position: "relative" }}>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openId === "faculty" ? "true" : "false"}
            aria-controls="nav-submenu-faculty"
            onClick={() => toggle("faculty")}
            ref={(el) => {
              if (el) togglesRef.current.set("faculty", el);
              else togglesRef.current.delete("faculty");
            }}
          >
            <span>Faculty</span>{" "}
            <span aria-hidden="true">▼</span>
          </button>

          <ul
            id="nav-submenu-faculty"
            aria-label="Faculty"
            hidden={openId !== "faculty"}
            style={{
              listStyle: "none",
              paddingLeft: 0,
              position: "absolute",
              top: "calc(100% + 0.25rem)",
              left: 0,
            }}
            onKeyDown={(event) => onSubmenuKeyDown("faculty", event)}
            ref={(el) => {
              if (el) listsRef.current.set("faculty", el);
              else listsRef.current.delete("faculty");
            }}
          >
            <li>
              <a href="/faculty/directory">Directory</a>
            </li>
            <li>
              <a href="/faculty/research">Research</a>
            </li>
            <li>
              <a href="/faculty/contact">Contact</a>
            </li>
          </ul>
        </li>

        <li style={{ position: "relative" }}>
          <a href="/about">About</a>
          <button
            type="button"
            aria-label="About menu"
            aria-haspopup="true"
            aria-expanded={openId === "about" ? "true" : "false"}
            aria-controls="nav-submenu-about"
            onClick={() => toggle("about")}
            ref={(el) => {
              if (el) togglesRef.current.set("about", el);
              else togglesRef.current.delete("about");
            }}
          >
            ▼
          </button>

          <ul
            id="nav-submenu-about"
            aria-label="About"
            hidden={openId !== "about"}
            style={{
              listStyle: "none",
              paddingLeft: 0,
              position: "absolute",
              top: "calc(100% + 0.25rem)",
              left: 0,
            }}
            onKeyDown={(event) => onSubmenuKeyDown("about", event)}
            ref={(el) => {
              if (el) listsRef.current.set("about", el);
              else listsRef.current.delete("about");
            }}
          >
            <li>
              <a href="/about/mission">Mission</a>
            </li>
            <li>
              <a href="/about/team">Team</a>
            </li>
            <li>
              <a href="/about/contact">Contact</a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}
```

## Acceptance Checks

Keyboard
-   Top-level links are reachable with Tab and activate normally.
-   If a parent has both a destination and submenu, Tab reaches the parent link, then the adjacent submenu toggle button.
-   Activating a toggle button opens/closes its submenu; focus remains on the toggle.
-   Tab enters submenu items only after the submenu is intentionally opened.
-   Tab from last submenu item closes the submenu and moves to the next element after it.
-   Shift+Tab from first submenu item closes the submenu and moves focus back to the toggle.
-   Esc closes the submenu and moves focus to the toggle.
-   When opening a submenu, any other open submenu closes.
Screen Reader
-   Toggle announces expanded/collapsed state via `aria-expanded`.
-   Closed submenus are not reachable.
-   Submenu items announce as links/buttons and operate normally.
-   Icon toggle buttons have accessible names that include the associated parent label (e.g., "Categories menu").
- On initial render, all sub-menus are closed (`aria-expanded="false"` on toggles; all sub-menus hidden/unreachable).
