"use client";

import { useRef } from "react";
import { setEnquiryStatusAction } from "@/app/admin/(panel)/actions";
import { ENQUIRY_STATUSES, type EnquiryStatus } from "@/lib/enquiry-status";

/** Status dropdown that saves as soon as it changes. */
export function StatusSelect({ id, value, name }: { id: string; value: EnquiryStatus; name: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setEnquiryStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        className="enq-status"
        data-status={value}
        defaultValue={value}
        aria-label={`Status for ${name}`}
        onChange={() => form.current?.requestSubmit()}
      >
        {ENQUIRY_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
    </form>
  );
}
