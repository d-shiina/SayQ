import "server-only";
import { prisma } from "./prisma";

/** 通し番号の桁数（freeeと同じ10桁ゼロ埋め） */
const SERIAL_DIGITS = 10;

/**
 * 次の請求書番号を通し番号で提案（例: INV-0000000051 の次は INV-0000000052）。
 * 既存番号の末尾の数字部分の最大値+1を採番するため、
 * 旧形式（202607-001 など）が混在していても重複せずに続きから振られる。
 */
export async function suggestInvoiceNo(userId: string): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    select: { invoiceNo: true },
  });

  let max = 0;
  for (const { invoiceNo } of invoices) {
    const m = invoiceNo.match(/(\d+)\s*$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return `INV-${String(max + 1).padStart(SERIAL_DIGITS, "0")}`;
}
