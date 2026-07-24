"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Content-Disposition ヘッダーからファイル名を取り出す（filename* を優先） */
function filenameFromContentDisposition(
  header: string | null,
): string | null {
  if (!header) return null;
  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      // フォールバックへ
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : null;
}

/**
 * PDFをfetchしてblobとして保存するダウンロードボタン。
 * - 生成中（サーバーレスのコールドスタートで数秒かかる）はスピナーを表示
 * - 失敗時はサーバーからのエラーメッセージを画面に表示
 * - blob + download属性はiOS Safariでも保存シートが開く
 */
export function PdfDownloadButton({
  id,
  invoiceNo,
}: {
  id: string;
  invoiceNo: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/invoices/${id}/pdf`);
      if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new Error(`PDFの生成に失敗しました (${res.status}) ${body}`);
      }
      const blob = await res.blob();
      const no = invoiceNo.startsWith("INV-") ? invoiceNo : `INV-${invoiceNo}`;
      // ファイル名はサーバーの Content-Disposition から取得（宛先_件名_タイトル_番号）
      const filename =
        filenameFromContentDisposition(
          res.headers.get("Content-Disposition"),
        ) ?? `御請求書_${no}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 保存シートが開くまでblob URLを保持
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "ダウンロードに失敗しました",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={download} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            PDFを生成中…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            PDFダウンロード
          </>
        )}
      </Button>
      {error && (
        <p className="max-w-72 text-right text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
