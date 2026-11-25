"use client";

import { useActionState, useState } from "react";
import { saveNotifyAction, type FormState } from "@/app/admin/(panel)/actions";
import { Icon } from "./icons";

const MAX = 20;

/** Notification preferences with any number of recipient addresses. */
export function NotifyForm({ enabled, ackEnabled, recipients }: { enabled: boolean; ackEnabled: boolean; recipients: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveNotifyAction, {});
  const [rows, setRows] = useState(() => (recipients.length ? recipients : [""]).map((value, i) => ({ id: `init-${i}`, value })));
  const [focusId, setFocusId] = useState<string | null>(null);

  return (
    <form action={action} className="admin-form admin-wide">
      <label className="admin-check">
        <input type="checkbox" name="enabled" defaultChecked={enabled} />
        <span>Email the recipients below when a new enquiry arrives</span>
      </label>
      <label className="admin-check">
        <input type="checkbox" name="ackEnabled" defaultChecked={ackEnabled} />
        <span>Send the visitor a confirmation email that we received their enquiry</span>
      </label>

      <fieldset className="mail-recipients">
        <legend>Notification recipients</legend>
        <ul>
          {rows.map((row, index) => (
            <li key={row.id}>
              <input
                name="recipient"
                type="email"
                inputMode="email"
                autoComplete="off"
                defaultValue={row.value}
                placeholder="team@yourcompany.com"
                aria-label={`Recipient ${index + 1}`}
                maxLength={254}
                autoFocus={focusId === row.id}
              />
              <button
                type="button"
                className="enq-act enq-act-danger"
                aria-label={`Remove recipient ${index + 1}`}
                title="Remove"
                disabled={rows.length === 1}
                onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="admin-btn admin-btn-line mail-add"
          disabled={rows.length >= MAX}
          onClick={() => {
            const created = { id: crypto.randomUUID(), value: "" };
            setRows((current) => [...current, created]);
            setFocusId(created.id);
          }}
        >
          <Icon name="plus" size={16} /> Add another email
        </button>
        <small className="admin-muted">Up to {MAX} addresses. Everyone listed gets each new-enquiry notification.</small>
      </fieldset>

      <p className={state.error ? "admin-error" : "admin-ok"} role="status">
        {state.error ?? state.ok}
      </p>
      <button type="submit" className="admin-btn" disabled={pending}>
        {pending ? "Saving…" : "Save notification settings"}
      </button>
    </form>
  );
}
