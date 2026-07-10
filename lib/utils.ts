import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 数値を日本円表記に整形（¥1,234） */
export function formatYen(value: number): string {
  return "¥" + Math.round(value).toLocaleString("ja-JP");
}

/** 数値を桁区切りに（1,234） */
export function formatNumber(value: number): string {
  return value.toLocaleString("ja-JP");
}

/** Date を YYYY年M月D日 表記に */
export function formatDateJa(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** Date を input[type=date] 用の YYYY-MM-DD に */
export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
