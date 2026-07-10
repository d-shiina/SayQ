"use client";

import { useRef } from "react";
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
  const statusFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">状態:</span>
        <form action={updateInvoiceStatusAction} ref={statusFormRef}>
          <input type="hidden" name="id" value={id} />
          {/* Radix Select のフォーム連携は描画タイミングに依存するため、
              自前の hidden input を同期的に更新してから送信する */}
          <input type="hidden" name="status" defaultValue={status} />
          <Select
            defaultValue={status}
            onValueChange={(v) => {
              const form = statusFormRef.current;
              if (!form) return;
              const input = form.elements.namedItem(
                "status",
              ) as HTMLInputElement | null;
              if (input) input.value = v;
              form.requestSubmit();
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
