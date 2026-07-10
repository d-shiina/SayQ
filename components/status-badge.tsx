import { Badge } from "@/components/ui/badge";
import { statusMeta } from "@/lib/invoice-status";

/**
 * 請求書ステータスの固定幅バッジ。
 * 文字数の違い（下書き/送付済み/入金済み）で列がガタつかないよう幅を揃える。
 */
export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <Badge
      variant={meta.variant}
      className="w-[4.5rem] justify-center px-0 text-center"
    >
      {meta.label}
    </Badge>
  );
}
