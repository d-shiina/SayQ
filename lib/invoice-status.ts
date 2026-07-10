export type InvoiceStatus = "draft" | "sent" | "paid";

export const STATUS_META: Record<
  InvoiceStatus,
  { label: string; variant: "muted" | "warning" | "success" }
> = {
  draft: { label: "下書き", variant: "muted" },
  sent: { label: "送付済み", variant: "warning" },
  paid: { label: "入金済み", variant: "success" },
};

export function statusMeta(status: string) {
  return STATUS_META[(status as InvoiceStatus)] ?? STATUS_META.draft;
}
