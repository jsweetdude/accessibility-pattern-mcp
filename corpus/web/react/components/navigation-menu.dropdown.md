---
id: navigation-menu.dropdown
title: Navigation Dropdown
stack: web/react
status: beta
latest_version: 0.1.0
tags: [navigation, dropdown, disclosure, account-menu, avatar-menu, header]
aliases: [account dropdown, user menu, avatar menu, profile menu, nav dropdown, links dropdown, account menu, header dropdown]
summary: A single-trigger, non-modal dropdown that reveals a short list of navigation links and optional actions, using a native button with aria-expanded plus DOM show/hide, and never role="menu".
---

# Navigation Dropdown

Pattern ID: `navigation-menu.dropdown`

A single-trigger, non-modal dropdown that reveals a short list of navigation links and optional actions, using a native `<button>` with `aria-expanded` plus DOM show/hide, and never `role="menu"`.

This is a disclosure of links, not an ARIA menu. The revealed content is primarily navigation destinations (with an optional trailing action such as "Sign out"), so it uses `aria-expanded` alone as the state signal and does not use `role="menu"` or `aria-haspopup`.

## Use When
- Use when a single dedicated control reveals a compact set of navigation destinations (e.g., an avatar button or an "Account" button opening "Profile", "Settings", "Billing").
- Use when the revealed content is short and stable, typically 3-10 items that are primarily links.
- Use when the revealed list ends in an optional single incidental action alongside the links (e.g., "Sign out").

## Do Not Use When
- Do not use when the site navigation is a bar of several top-level items or sibling dropdowns (use `navigation-menu.basic`).
- Do not use when the revealed items are primarily in-place commands or actions that need arrow-key navigation and `role="menu"` (use `menu.basic`).
- Do not use when the control chooses a value to submit in a form (use `select.native`).
- Do not use when the trigger shows and hides arbitrary non-navigational content (use `disclosure.basic`).

## Must Haves

### Roles & structure
- Use a native `<button>` (preferred), or `role="button"` only when a native button cannot be used.
  - If `role="button"` is used instead of a native `<button>`, add `tabindex="0"` and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating the control.
- The list is shown/hidden in the DOM (e.g., via the `hidden` attribute), so that when closed, its content cannot be reached by keyboard or screen readers.
- Items are contained in a list structure (`<ul><li>…</li></ul>`) holding links and an optional trailing action `<button>`.
  - Any links and buttons comply with the rules for the `link.basic` and `button.basic` patterns.

### Accessible name
- The button has an accessible name that describes its purpose or action.
  - For an icon-only avatar button, provide an accessible name using `aria-label` or `aria-labelledby`.
- Icons within the button are decorative (`aria-hidden="true"`).

### State & properties
- The button reflects open state with `aria-expanded="true|false"`.
- The button is associated with the list container via `aria-controls="IDREF"`.
- The button does not carry `aria-haspopup`.
  - A list of links is not a menu, listbox, tree, grid, or dialog, so `aria-haspopup` announces a widget that is not present; `aria-expanded` alone is the correct signal.

### Focus
- When the dropdown opens, focus remains on the invoking button.
  - Keyboard users reach the first item with Tab.
- The dropdown does not trap focus. Users can Tab through the items and continue to the rest of the page.
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the invoking button and every item inside the list.

### Dismissal
- When focus moves outside the button and list (Tab away, click elsewhere), the dropdown closes.
- Esc closes the dropdown and returns focus to the invoking button (use `requestAnimationFrame` for the focus restore).

## Customizable
- Whether the list contains only links or links plus a single trailing action button (e.g., "Sign out").
- Whether the dropdown closes when an item is activated (often yes).
- Positioning of the list (left/right alignment, above/below) as long as DOM order and focus order remain logical.
- The disclosure indicator (e.g., a down caret) is decorative and may be omitted; when present it is marked `aria-hidden="true"` and does not replace the button's accessible name.
- Accessible labeling strategy:
  - The button label may be visible text (e.g., "Account") or, for an icon-only avatar button, an `aria-label` or `aria-labelledby`.
  - The list may carry an optional `aria-label` (e.g., `aria-label="Account"`).

## Don'ts
- Do not use `role="menu"` or `role="menuitem"`; the items are links in a list, not menu commands.
- Do not add `aria-haspopup` to the button; it announces a menu that is not there.
- Do not render the button without `aria-expanded`; state alone is what conveys open or closed.
- Do not make hover or pointer click the only way to open the dropdown; opening must also work with keyboard Enter and Space.
- Do not leave the list visible while `aria-expanded="false"` (and vice versa).
- Do not close the dropdown in a way that strands focus (e.g., removing the focused element without moving focus).
- Do not let a hidden dropdown be the only path to a destination; expose those links elsewhere on the site as well.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function NavigationDropdown() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const baseId = useId();
  const buttonId = `${baseId}-button`;
  const listId = `${baseId}-list`;

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Close on outside pointer press (non-modal disclosure).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const btn = btnRef.current;
      const list = listRef.current;
      if (!btn || !list) return;
      if (!btn.contains(e.target) && !list.contains(e.target)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // Close when focus leaves button + list.
  useEffect(() => {
    if (!open) return;
    const onFocusIn = (e) => {
      const btn = btnRef.current;
      const list = listRef.current;
      if (!btn || !list) return;
      if (!btn.contains(e.target) && !list.contains(e.target)) close();
    };
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, [open, close]);

  // Esc closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
      // rAF defers focus until React flushes the close and the trigger is focusable again.
      requestAnimationFrame(() => btnRef.current?.focus());
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, close]);

  // Close on Tab past the last item and Shift+Tab before the first item.
  const onListKeyDown = (e) => {
    if (!open || e.key !== "Tab") return;

    const list = listRef.current;
    if (!list) return;

    const focusables = Array.from(
      list.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!e.shiftKey && document.activeElement === last) close();
    if (e.shiftKey && document.activeElement === first) close();
  };

  return (
    <div>
      {/* No aria-haspopup: a list of links is not a menu. aria-expanded is the state signal. */}
      <button
        ref={btnRef}
        id={buttonId}
        type="button"
        aria-expanded={open ? "true" : "false"}
        aria-controls={listId}
        onClick={toggle}
      >
        Account <span aria-hidden="true">▼</span>
      </button>

      <ul
        id={listId}
        ref={listRef}
        hidden={!open}
        aria-label="Account"
        onKeyDown={onListKeyDown}
      >
        {ACCOUNT_LINKS.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => alert("Signed out")}>
            Sign out
          </button>
        </li>
      </ul>
    </div>
  );
}

const ACCOUNT_LINKS = [
  { label: "Profile", href: "/account/profile" },
  { label: "Watchlist", href: "/account/watchlist" },
  { label: "Subscription", href: "/account/subscription" },
  { label: "Settings", href: "/account/settings" },
];
```

## Acceptance Checks

Keyboard
- Tab reaches the invoking button.
- Enter or Space opens the dropdown; focus remains on the button.
- Tab moves from the button into the first item, then through each item, then out to the next focusable element on the page.
- Tab from the last item closes the dropdown and moves to the next focusable element after it.
- Shift+Tab from the first item closes the dropdown and moves focus back to the button.
- Esc closes the dropdown and returns focus to the button.
- If focus moves outside the button and list (Tab away or click elsewhere), the dropdown closes.

Screen Reader
- The button announces expanded/collapsed state via `aria-expanded`; the attribute is present and flips between `"true"` and `"false"` on every open and close.
- The button is not announced as a menu; no `role="menu"` or `aria-haspopup` is present.
- The button exposes an accessible name (visible text or `aria-label`/`aria-labelledby` on an icon-only avatar button).
- When closed, the items are not reachable.
- When open, the list and its items are reachable in reading and focus order.
- Items announce as links and navigate correctly; the trailing action announces as a button and activates correctly.
