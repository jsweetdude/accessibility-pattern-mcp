---
id: dialog.nonmodal
title: "Dialog (Non-Modal)"
stack: web/react
status: beta
latest_version: 0.1.0
tags: [dialog, non-modal, overlay, popover, focus-restoration, modeless]
aliases: [non-modal dialog, modeless dialog, non-blocking dialog, popover dialog, editor popover, composer panel, floating panel]
summary: A dialog that does not block the page; uses role="dialog" with an accessible name, moves focus in on open and restores it on close, but does not trap focus or inert the background.
---

# Dialog (Non-Modal)

Pattern ID: `dialog.nonmodal`

A dialog that does not block the page; uses `role="dialog"` with an accessible name, moves focus in on open and restores it on close, but does not trap focus or `inert` the background.

This is the counterpart to `dialog.modal`; the defining contrast is the absence of background isolation and focus trapping.

## Use When
- Use when an overlay presents content or a task without blocking the page (e.g., a non-blocking editor popover, a composer, a rich panel with interactive controls).
- Use when the user can keep interacting with the rest of the page while the overlay is open.
- Use when focus should move into the dialog on open but not be trapped there.

## Do Not Use When
- Do not use when the user must complete or dismiss the overlay before returning to the page (use `dialog.modal`).
- Do not use when a control simply shows and hides inline content (use `disclosure.basic`).
- Do not use when the overlay is a menu of commands (use `menu.basic`).
- Do not use when the message is a brief, non-interactive status update (use `toast.basic`).
- Do not use when the content is a plain-text supplementary hint (use `tooltip.basic`).

## Must Haves
- The dialog surface uses `role="dialog"`, or a native `<dialog>` element shown non-modally (rendered in the DOM or opened with `.show()`, never `.showModal()`).
- The dialog has an accessible name via `aria-labelledby` (preferred), referencing a visible title element (e.g., `<h2 id="...">`), or `aria-label`.
- Focus moves into the dialog on open, landing on the dialog container or its first interactive control.
- Esc closes the dialog, regardless of where focus currently sits, since focus is not trapped and may have moved into the page.
- Focus is restored to the invoking element on close.
  - Capture the invoking element at open time, and restore focus with `requestAnimationFrame` after the dialog is unmounted.
- The dialog does not trap focus. Tab and Shift+Tab move out of the dialog into the rest of the page, which stays interactive.
- The dialog does not set `aria-modal="true"` and does not apply `inert` to the background.
- Provide a visible close control. Use a native `<button>` (preferred), or `role="button"` only when a native button cannot be used.
  - If `role="button"` is used instead of a native `<button>`, add `tabindex="0"` and keyboard support for Enter and Space, ensuring Space prevents page scrolling while activating the control.
- The close control has an accessible name that describes its purpose or action (e.g., `aria-label="Close"`).
- Ensure a visible focus state (e.g., a 2px solid outline offset by 1-2px) around the trigger, the close control, and any focusable content within the dialog.

## Customizable
- Delivery is at the engineer's discretion as long as the non-modal contract above holds. Acceptable options:
  - A native `<dialog>` element shown non-modally.
  - The `popover` attribute, which adds light dismiss on outside click and Esc for free.
  - A `<div role="dialog">` with explicit positioning.
- Whether an outside click also dismisses the dialog is optional. The `popover` attribute provides it automatically; a `role="dialog"` div may add it via an outside-pointer handler, or omit it.
- Initial focus may land on the dialog container (`tabindex="-1"`) so the accessible name is announced before the user Tabs to the first control, or on the first interactive control when the user's next action is to type or select. Either is acceptable.

## Don'ts
- Do not set `aria-modal="true"` on a non-modal dialog; it falsely tells assistive technology the background is inert.
- Do not trap focus within the dialog.
- Do not apply `inert` to, or otherwise block, the background content.
- Do not omit focus restoration; closing the dialog must return focus to the element that invoked it.
- Do not bind Esc only to a container-level handler on the dialog surface; once focus leaves the untrapped dialog, that handler stops firing and Esc no longer closes.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function NonModalDialog() {
  const [open, setOpen] = useState(false);
  const openerRef = useRef(null);
  const dialogRef = useRef(null);
  const titleId = useId();

  const openDialog = () => {
    // Capture the opener at the moment we open, so focus can be restored on close.
    openerRef.current = document.activeElement;
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    // Defer until the dialog has unmounted and the opener is focusable again.
    const opener = openerRef.current;
    requestAnimationFrame(() => opener?.focus());
  };

  // Move focus into the dialog on open. No focus trap: Tab leaves the dialog
  // into the rest of the page, which stays interactive (no inert, no aria-modal).
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  // Esc must close from anywhere, because focus is not trapped and may sit in
  // the page. A container-level onKeyDown would miss those keystrokes, so bind
  // Esc at the document level while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div>
      <button type="button" onClick={openDialog}>
        Edit note
      </button>

      {/* The rest of the page stays interactive while the dialog is open. */}
      <button
        type="button"
        onClick={() => alert("Background control still works")}
      >
        Background action
      </button>

      {open
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-labelledby={titleId}
              tabIndex={-1}
              style={{
                position: "fixed",
                top: 80,
                right: 24,
                width: "min(360px, 100%)",
                border: "1px solid rgba(0,0,0,0.3)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h2 id={titleId} style={{ margin: 0 }}>
                  Edit note
                </h2>
                <button type="button" onClick={closeDialog} aria-label="Close">
                  <span aria-hidden="true">×</span>
                </button>
              </div>

              <label>
                Note
                <textarea defaultValue={DEFAULT_NOTES[0]} rows={4} />
              </label>

              <button type="button" onClick={closeDialog}>
                Save
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

const DEFAULT_NOTES = [
  "Reminder: finish the S2 finale review before it leaves the service on Friday.",
];
```

## Acceptance Checks
- On open:
  - Focus moves into the dialog.
  - The dialog is announced with its accessible name.
  - Background content remains reachable and interactive.

- While open:
  - Esc closes the dialog, including when focus has moved out of the dialog into the page.
  - Tab and Shift+Tab move focus out of the dialog into the page, confirming focus is not trapped.
  - The trigger, the close control, and any focusable content within the dialog show a visible focus indicator (e.g., a 2px solid outline) when focused.

- On close:
  - Focus returns to the invoking element.
