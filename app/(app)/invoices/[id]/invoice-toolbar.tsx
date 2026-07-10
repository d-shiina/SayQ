"use client";

import Link from "next/link";
import { Pencil, Printer, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteInvoiceAction,
  duplicateInvoiceAction,
  updateInvoiceStatusAction,
} from "../actions";

export function InvoiceToolbar({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">状態:</span>
        <form action={updateInvoiceStatusAction} id={`status-${id}`}>
          <input type="hidden" name="id" value={id} />
          <Select
            name="status"
            defaultValue={status}
            onValueChange={() => {
              // Radix Select が name="status" の隠しフィールドを描画するため、
              // 値変更を反映してからフォームを送信する
              const form = document.getElementById(
                `status-${id}`,
              ) as HTMLFormElement | null;
              requestAnimationFrame(() => form?.requestSubmit());
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">下書き</SelectItem>
              <SelectItem value="sent">送付済み</SelectItem>
              <SelectItem value="paid">入金済み</SelectItem>
            </SelectContent>
          </Select>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <form action={duplicateInvoiceAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="outline" size="sm">
            <Copy className="h-4 w-4" />
            複製
          </Button>
        </form>
        <Button asChild variant="outline" size="sm">
          <Link href={`/invoices/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            編集
          </Link>
        </Button>
        <form
          action={deleteInvoiceAction}
          onSubmit={(e) => {
            if (!confirm("この請求書を削除しますか？この操作は取り消せません。")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={id} />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
        </form>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          印刷 / PDF
        </Button>
      </div>
    </div>
  );
}
