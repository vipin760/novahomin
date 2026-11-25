/** Lead pipeline. An enquiry with no stored status counts as "new". Shared by server and client. */
export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]["value"];

export const isStatus = (value: unknown): value is EnquiryStatus =>
  ENQUIRY_STATUSES.some((status) => status.value === value);

export const statusLabel = (value: string) => ENQUIRY_STATUSES.find((status) => status.value === value)?.label ?? "New";
