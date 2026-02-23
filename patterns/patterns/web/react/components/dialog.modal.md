---
id: dialog.modal
stack: web/react
status: beta
tags: [dialog, modal, pop-up, overlay, focus-trap, blocking]
aliases: [dialog, modal, pop-up]
summary: User-initiated blocking dialog that traps focus, inerts background content, and restores focus on close.
---

# Dialog (Modal)

## Use When
- Use when content appears in an overlay that blocks interaction with the underlying page.
- Use when keyboard focus must move into the dialog and remain contained until dismissal.
- Use when the user must explicitly complete or dismiss the dialog before returning to the main interface.

## Do Not Use When
- Do not use when the content is part of the normal page flow and does not block background interaction.
- Do not use when presenting brief, non-blocking status messages that do not require focus movement (use `toast` or `snackbar`).
- Do not use when the message is urgent and requires immediate acknowledgment (use `dialog.alert`).
- Do not use when the interaction involves complex, multi-step workflows spanning multiple screens.

## Must Haves
- Render an overlay/backdrop that is not exposed as a separate landmark:
  - Backdrop uses `role="presentation"` (or equivalent non-semantic container).
  - Clicking the backdrop (outside the dialog surface) closes the dialog.
  - Clicking inside the dialog must not close the dialog.
- Dialog semantics:
  - Dialog surface has `role="dialog"` (or native `<dialog>` with equivalent semantics).
  - Dialog surface sets `aria-modal="true"`.
  - Dialog surface is focusable for entry (`tabIndex={-1}` or equivalent) and receives initial focus on open.
- Accessible naming (required):
  - Dialog has an accessible name via `aria-labelledby` (preferred) or `aria-label`.
  - If `aria-labelledby` is used, it must reference a visible title element (e.g., `<h2 id="...">`).
- Accessible description (recommended when present):
  - If a description is rendered, it should be referenced by `aria-describedby` (do not rely on incidental reading order).
- Focus management:
  - Capture the invoking element on open.
  - Move focus into the dialog on open.
  - Trap keyboard focus within the dialog while open.
  - Restore focus to the invoking element on close.
- Dismiss behavior:
  - Escape closes the dialog.
  - Provide a visible close control (`<button type="button">`) with an accessible name (e.g., `aria-label="Close dialog"`).
- Background isolation:
  - Background application content **must not** be focusable or reachable by keyboard or screen readers while the dialog is open.
  - Enforce via `inert` on the app root (preferred when available) or an equivalent approach.
- Visible focus:
  - All focusable elements inside the dialog must have a clearly visible focus indicator.

## Customizable
- The `<dialog>` element does not have perfect browser support yet. For this reason, we still recommend using `role="dialog"` and `aria-modal="true"`. The engineer may use `<dialog>`, but if they do, they must still include `aria-modal="true"`.

## Don’ts
- Do not rely on the native `<dialog>` element for consistent cross-browser modal behavior in portal-based applications.
- Don’t rely on `aria-modal="true"` to block background interaction; it does not prevent focus/pointer access on its own.
- Don’t render the modal inside containers that create clipping or stacking contexts (e.g., `overflow: hidden/auto`, `transform`), and don’t rely on `z-index` alone to “make it work.”
- Don’t inert `document.body` or `document.documentElement`; inert only the application content root.
- Don’t omit focus restoration; closing a modal must return the user to where they were.

## Golden Pattern

```js
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export function ModalDialog({
  open,
  title,
  description,
  onClose,
  children,
  inertRoot,
}) {
  const titleId = React.useId();

  const dialogRef = React.useRef(null);
  const openerRef = React.useRef(null);

  // Capture the opener at the moment we open (so focus can be restored on close).
  React.useLayoutEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
  }, [open]);

  // Background inert while open (optional; depends on target root existing).
  React.useEffect(() => {
    const target =
      inertRoot || document.getElementById("app-root");

    if (!target) return;

    if (open) {
      target.setAttribute("inert", "");
    } else {
      target.removeAttribute("inert");
    }

    return () => {
      target.removeAttribute("inert");
    };
  }, [open, inertRoot]);

  // Focus entry + restore.
  React.useEffect(() => {
    if (!open) {
      if (openerRef.current && typeof openerRef.current.focus === "function") {
        openerRef.current.focus();
      }
      return;
    }

    if (dialogRef.current && typeof dialogRef.current.focus === "function") {
      dialogRef.current.focus();
    }
  }, [open]);

  // Close on Escape.
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "rgba(0,0,0,0.55)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: "min(560px, 100%)",
          background: "white",
          color: "black",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 id={titleId} style={{ margin: 0 }}>
              {title}
            </h2>
            {description ? (
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.2)",
              background: "transparent",
              display: "inline-grid",
              placeItems: "center",
              lineHeight: 1,
              cursor: "pointer",
              flex: "0 0 auto",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 18 }}>
              ×
            </span>
          </button>
        </div>

        <div style={{ marginTop: 16 }}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
```

## Acceptance Checks
- On open:
  - Focus moves to the dialog.
  - Dialog is announced with its accessible name.
  - Background content is not reachable by keyboard or screen reader.

- While open:
  - Tab and Shift+Tab remain within the dialog.
  - Escape closes the dialog.
  - Clicking the backdrop closes the dialog.
  - Clicking inside the dialog does not close it.
  - Focus indicators are visible on all interactive elements.

- On close:
  - Focus returns to the invoking element.
  - Background content becomes interactive again.

- Semantics:
  - Dialog has `role="dialog"` and `aria-modal="true"`.
  - Dialog has an accessible name.
  - Close button has an accessible name.
