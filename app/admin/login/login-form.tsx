"use client";

import { useActionState, useId, useState } from "react";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const errorId = useId();
  const hasError = Boolean(state.error);

  return (
    <form action={action} className="admin-form" aria-busy={pending}>
      <label>
        <span>Username</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
          maxLength={200}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
        />
      </label>
      <label>
        <span>Password</span>
        <span className="admin-password">
          <input
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={200}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            onBlur={() => setCapsLock(false)}
          />
          <button
            type="button"
            className="admin-eye"
            onClick={() => setVisible((value) => !value)}
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible ? null : <path d="M4 4l16 16" />}
            </svg>
          </button>
        </span>
        {capsLock ? (
          <small className="admin-login-hint" role="status">
            Caps Lock is on
          </small>
        ) : null}
      </label>
      <button type="submit" className="admin-btn admin-login-submit" disabled={pending}>
        {pending ? <span className="admin-spinner" aria-hidden="true" /> : null}
        <span>{pending ? "Signing in…" : "Sign in"}</span>
      </button>
      <p id={errorId} className="admin-error" role="alert">
        {state.error}
      </p>
    </form>
  );
}
