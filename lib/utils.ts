import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 数値を日本円表記に整形（¥1,234 / -¥1,234） */
export function formatYen(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  return sign + "¥" + Math.abs(rounded).toLocaleString("ja-JP");
}

/** 数値を桁区切りに（1,234） */
export function formatNumber(value: number): string {
  return value.toLocaleString("ja-JP");
}

/**
 * Date を YYYY年M月D日 表記に。
 * 日付は "YYYY-MM-DD" 由来（UTC深夜）で保存されるため、
 * サーバーのタイムゾーンに依存しないよう UTC 基準で読む。
 */
export function formatDateJa(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

/** Date を input[type=date] 用の YYYY-MM-DD に（UTC基準） */
export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

/** 対象月 (YYYY-MM) を YYYY年M月 表記に */
export function formatBillingMonth(ym: string): string {
  const [y, m] = ym.split("-");
  if (!y || !m) return ym;
  return `${y}年${Number(m)}月`;
}

/** 当月の YYYY-MM を返す（サーバー/クライアント共通） */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
