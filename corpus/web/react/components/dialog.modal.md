---
id: dialog.modal
title: "Dialog (Modal)"
stack: web/react
status: beta
latest_version: 0.3.1
tags: [dialog, modal, pop-up, overlay, focus-trap, blocking, native-dialog, show-modal]
aliases: [dialog, modal, pop-up]
summary: User-initiated blocking dialog. Uses the native <dialog> element with .showModal() so the browser handles focus trap, background inertness, Escape dismissal, focus restoration, and top-layer rendering.
---

# Dialog (Modal)

Pattern ID: `dialog.modal`

User-initiated blocking dialog. Uses the native `<dialog>` element with `.showModal()` so the browser handles focus trap, background inertness, Escape dismissal, focus restoration, and top-layer rendering. When the native element cannot be used, a manual `<div role="dialog">` fallback is documented under Customizable with the full behavior contract that must be implemented by hand.

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
- Use the native `<dialog>` element (preferred). When `<dialog>` cannot be used, `<div role="dialog">` is the documented fallback — see Customizable → Manual fallback.
- **Open with `.showModal()`, close with `.close()`.** A `<dialog>` present in the DOM without `.showModal()` is non-modal — no focus trap, no background inertness, no `aria-modal`, no top-layer rendering. Unmounting a `<dialog>` while open (rather than calling `.close()`) leaves focus stranded because the browser's focus-restoration to the invoker runs on `.close()` (or on the browser's implicit `.close()` from Esc's `cancel` event and from `<form method="dialog">` submits). Both lifecycle endpoints must be exercised.
- Dialog surface has an accessible name via `aria-labelledby` (preferred) or `aria-label`. If `aria-labelledby` is used, it references a visible title element (e.g., `<h2 id="...">`).
- If a description is rendered, it is referenced by `aria-describedby`. Do not rely on incidental reading order.
- Dialog width is fluid so content reflows at 400% zoom (WCAG 1.4.10 Reflow). Prefer `max-width: min(<Npx>, 100%)`; do not set fixed pixel widths that would exceed the 320-CSS-pixel viewport at 400% zoom.
- Provide a visible close control (`<button type="button">`) with an accessible name (e.g., `aria-label="Close dialog"`).
- The invoking control declares dialog-trigger semantics — apply `aria-haspopup="dialog"` to the trigger element.
- The dialog satisfies the following behavior contract (all six required):
  - Focus moves into the dialog on open.
  - Focus is trapped within the dialog while open.
  - Escape closes the dialog.
  - Focus returns to the invoking element on close.
  - Background content is not focusable or reachable by keyboard or screen readers while open.
  - Body scroll is prevented while open.
- Under native `<dialog>` + `.showModal()` (the Golden Pattern), these six behaviors are provided automatically by the browser. Under the manual `<div role="dialog">` fallback (Customizable → Manual fallback), each is the implementation's responsibility.
- Focus indicators on the dialog surface, close button, and any focusable content follow the [Foundations focus rule](/web/react/foundations#rule-focus-states).

## Customizable
- **Manual `<div role="dialog">` fallback** when native `<dialog>` cannot be used (portal / stacking-context conflicts, legacy target matrix). Implement all six behaviors by hand: `aria-modal="true"`, focus trap, `inert` on the app content root (never `body` or `documentElement`), body scroll lock (on iOS Safari use `position: fixed; top: -${scrollY}px`), Escape listener, focus restoration, and render via portal to `document.body`.
- **Backdrop click closes** by default; may be intentionally disabled for destructive confirmations so users must Cancel or Confirm explicitly.
- **Initial focus target** — three acceptable defaults:
  - the dialog surface (`tabIndex={-1}`) — accessible name announces, then Tab to first control (default under `.showModal()`);
  - a safe-default control (Cancel / Close) for destructive confirmations, to prevent inadvertent Enter-confirm;
  - the first interactive element for form-shaped dialogs.
- **`<form method="dialog">`** may be used for zero-JS form dismiss — the submit button's `value` becomes `dialog.returnValue` on the `close` event.

## Don'ts
- Do not render `<dialog>` without calling `.showModal()` and expect modal behavior. A bare `<dialog>` produces a non-modal reveal with none of the modal contract.
- Do not implement the manual `<div role="dialog">` fallback without every one of its Must Haves. Partial implementations produce broken screen-reader announcements and stranded focus.
- Do not rely on `aria-modal="true"` to block background interaction; it is announcement metadata, not an interaction gate. Background isolation is a separate implementation concern.
- Do not render the manual fallback inside containers that create clipping or stacking contexts (e.g., `overflow: hidden/auto`, `transform`), and do not rely on `z-index` alone to "make it work."
- Do not inert `document.body` or `document.documentElement` on the manual fallback; inert only the application content root.
- Do not omit focus restoration; closing a dialog must return the user to the element that invoked it.
- Do not set fixed pixel widths on the dialog surface that exceed the 320-CSS-pixel viewport at 400% zoom.

## Golden Pattern

Structural reference for AI coding assistants — semantics, focus, and keyboard behavior. Styling, copy, and demo data are illustrative.

```jsx
"use client";

export function ModalDialog({
  open,
  title,
  description,
  onClose,
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // Open / close the native dialog imperatively when `open` changes.
  // .showModal() is what produces the modal contract: focus trap, background
  // inertness, Escape dismissal, focus restoration, and top-layer rendering.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Route the browser's `cancel` (Escape) and `close` events through onClose
  // so callers see a single close pathway. preventDefault on `cancel` lets
  // the effect above handle el.close() for consistency.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handleCancel = (e) => {
      e.preventDefault();
      onClose();
    };
    const handleClose = () => onClose();
    el.addEventListener("cancel", handleCancel);
    el.addEventListener("close", handleClose);
    return () => {
      el.removeEventListener("cancel", handleCancel);
      el.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  // Backdrop click closes. A click that lands on the <dialog> element itself
  // (not on a content descendant) is a click on the padding around the
  // content — treat that as a backdrop dismiss.
  const handleClick = (e) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClick={handleClick}
      style={{
        maxWidth: "min(560px, 100%)",
        border: 0,
        borderRadius: 12,
        padding: 16,
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
            <p style={{ marginTop: 8, marginBottom: 0 }}>{description}</p>
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
    </dialog>
  );
}
```

## Acceptance Checks
- On open:
  - Focus moves into the dialog.
  - Dialog is announced with its accessible name.
  - Background content is not reachable by keyboard or screen reader.
  - Body scroll is prevented.

- While open:
  - Tab and Shift+Tab remain within the dialog.
  - Escape closes the dialog.
  - Clicking the backdrop closes the dialog (unless the pattern has intentionally opted out per Customizable → Backdrop click contract).
  - Clicking inside the dialog content does not close it.
  - Focus indicators on all interactive elements follow the Foundations focus rule.

- On close:
  - Focus returns to the invoking element.
  - Background content becomes interactive again.
  - Body scroll is restored.

- Semantics:
  - Dialog has an accessible name.
  - Close button has an accessible name.
  - Under native `<dialog>` + `.showModal()`, the modal state is conveyed by the top-layer/modal contract; under the manual fallback, `aria-modal="true"` is set explicitly.
  - The invoking control declares dialog-trigger semantics (e.g., `aria-haspopup="dialog"`).

- Reflow:
  - At 400% browser zoom (~320 CSS pixels wide), dialog content reflows within the viewport without horizontal scrolling.
