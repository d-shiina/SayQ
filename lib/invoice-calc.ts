// 請求金額の計算ロジック（税率別集計・端数処理）

export type TaxRounding = "floor" | "round" | "ceil";

export interface CalcItem {
  quantity: number;
  unitPrice: number;
  taxRate: number; // 10 / 8 / 0
}

export interface TaxLine {
  rate: number; // 税率(%)
  net: number; // 税抜対象額
  tax: number; // 消費税額
}

export interface InvoiceTotals {
  subtotal: number; // 税抜小計
  taxLines: TaxLine[]; // 税率別の消費税
  totalTax: number; // 消費税合計
  total: number; // 税込合計
}

function applyRounding(value: number, mode: TaxRounding): number {
  switch (mode) {
    case "round":
      return Math.round(value);
    case "ceil":
      return Math.ceil(value);
    case "floor":
    default:
      return Math.floor(value);
  }
}

export function lineNet(item: CalcItem): number {
  return item.quantity * item.unitPrice;
}

/**
 * 税率別に集計し、税率ごとに端数処理した消費税を求める。
 * （日本の適格請求書では税率ごとに1回の端数処理が原則）
 */
export function calcTotals(
  items: CalcItem[],
  rounding: TaxRounding = "floor",
): InvoiceTotals {
  const byRate = new Map<number, number>();
  let subtotal = 0;

  for (const item of items) {
    const net = lineNet(item);
    subtotal += net;
    byRate.set(item.taxRate, (byRate.get(item.taxRate) ?? 0) + net);
  }

  const taxLines: TaxLine[] = [];
  let totalTax = 0;

  // 税率の高い順に並べる（10% → 8% → 0%）
  const rates = Array.from(byRate.keys()).sort((a, b) => b - a);
  for (const rate of rates) {
    const net = byRate.get(rate) ?? 0;
    const tax = rate > 0 ? applyRounding((net * rate) / 100, rounding) : 0;
    taxLines.push({ rate, net, tax });
    totalTax += tax;
  }

  return {
    subtotal,
    taxLines,
    totalTax,
    total: subtotal + totalTax,
  };
}
