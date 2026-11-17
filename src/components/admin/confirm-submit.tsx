'use client';

import type { ReactNode } from 'react';

/**
 * A submit button that asks before it acts.
 *
 * `window.confirm` rather than a custom dialog: it is the confirmation the browser
 * itself guarantees (focus, keyboard, escape, screen-reader announcement), and it
 * cannot be dismissed by a stray click on a backdrop. If JavaScript is unavailable
 * the form still submits — the server action is the real protection, not this.
 */
export function ConfirmSubmit({
  children,
  message,
  className,
}: {
  children: ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
