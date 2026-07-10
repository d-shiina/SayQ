import "server-only";
import { prisma } from "./prisma";

/** 対象月から次の請求書番号を提案（例: 2026-07 → 202607-001、既存があれば連番） */
export async function suggestInvoiceNo(
  userId: string,
  billingMonth: string,
): Promise<string> {
  const prefix = billingMonth.replace("-", "");
  const count = await prisma.invoice.count({
    where: { userId, invoiceNo: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}
