---
id: toast.basic
stack: web/react
status: beta
tags: [toast, notification, status, live-region]
aliases: [notification, toast, transient message, status message]
summary: Temporary, non-blocking status message announced via live region. May include optional dismiss control. Disappears automatically.
---

# Toast

## Use When

- Use when presenting a temporary, non-blocking status message.
- Use when the message confirms an action (e.g., “Saved”, “Added to watchlist”).
- Use when the message is text-only and contains no required actions, except for (at most) a dismiss button.

## Do Not Use When
- Do not use when the message requires user acknowledgment, moves keyboard focus, or blocks background interaction (use `dialog`).
- Do not use when the message is urgent or must interrupt the user immediately (use `dialog.alert`).
- Do not use when the message includes required actions or interactive controls beyond simple dismissal (use `snackbar`).

## Must Haves

- The live region container must be present in the DOM when the page/view loads.
- The toast message must be announced via `role="status"`, or an equivalent such as `aria-live="polite"` and `aria-atomic="true"`.
- When a toast is triggered, its message text must be injected into the existing live region container.
- The toast must not move focus automatically when it appears.
- The toast must disappear automatically (recommended ~5 seconds).
- The live region text must be cleared when the toast dismisses to avoid stale messages being discovered later.
- If a dismiss button is present, it must not steal focus when the toast appears.

## Customizable

- Visual placement (top-right, bottom-center, etc.).
- Duration (within reasonable non-disruptive bounds).
- Whether a dismiss button is included.
- Styling (color, elevation, animation).

## Don'ts

- Don’t mount/unmount the live region container based on toast visibility.
- Do not move focus into the toast when it appears.
- Do not use `role="alertdialog"`.
- The toast must not contain buttons or elements that require user action (use `snackbar` or `dialog` instead).

## Golden Pattern

```jsx
"use client";

import * as React from "react";

const ToastContext = React.createContext(() => {});

export function ToastProvider({ children }) {
  const [message, setMessage] = React.useState("");
  const timeoutRef = React.useRef(null);

  const showToast = React.useCallback((text) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setMessage(text);
    timeoutRef.current = window.setTimeout(() => setMessage(""), 5000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {/* Live region is always mounted */}
      <div role="status" aria-atomic="true">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}

/** Demo */
export function ToastDemo() {
  const toast = useToast();

  return (
    <div>
      <button type="button" onClick={() => toast("Saved successfully.")}>
        Save
      </button>
    </div>
  );
}
```

## Acceptance Checks

- Keyboard
  - Trigger a toast via keyboard.
  - Focus remains on the triggering control.
  - No focus is moved into the toast.
- Screen Reader
  - When triggered, the message is announced once as a polite status update.
  - The message is not announced repeatedly.
  - After the toast auto-dismisses, the live region is cleared (stale text is not discoverable later).
  - Triggering a new toast replaces the previous announcement.
