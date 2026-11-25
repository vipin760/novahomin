"use client";

import { useState } from "react";
import { Icon } from "./icons";

/** Copies text to the clipboard and confirms briefly. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="enq-act"
      aria-label={done ? "Copied" : label}
      title={done ? "Copied" : label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable (insecure context): ignore */
        }
      }}
    >
      <Icon name={done ? "check" : "copy"} size={16} />
    </button>
  );
}

/** Delete button that asks for confirmation before submitting its form. */
export function ConfirmDelete({ name }: { name: string }) {
  return (
    <button
      type="submit"
      className="enq-act enq-act-danger"
      aria-label={`Delete enquiry from ${name}`}
      title="Delete"
      onClick={(event) => {
        if (!window.confirm(`Delete the enquiry from ${name}? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <Icon name="trash" size={16} />
    </button>
  );
}
