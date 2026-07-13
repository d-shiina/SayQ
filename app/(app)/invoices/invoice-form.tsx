"use client";

import { useMemo, useState, useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatYen } from "@/lib/utils";
import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import { DatePicker } from "@/components/date-picker";
import { MonthPicker } from "@/components/month-picker";
import {
  createInvoiceAction,
  updateInvoiceAction,
  type InvoiceState,
} from "./actions";

export interface ClientOption {
  id: string;
  name: string;
  honorific: string;
}

interface ItemRow {
  key: string;
  name: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  taxRate: number;
}

export interface InvoiceFormData {
  id?: string;
  clientId: string;
  invoiceNo: string;
  title: string;
  subject: string;
  billingMonth: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  taxRounding: TaxRounding;
  items: Omit<ItemRow, "key">[];
}

let keySeq = 0;
const nextKey = () => `row-${keySeq++}`;

function SubmitButton({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "保存中…" : label}
    </Button>
  );
}

/** モバイルのみ表示する明細フィールドのラベル */
function MobileFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-medium text-muted-foreground md:hidden">
      {children}
    </span>
  );
}

function emptyRow(): ItemRow {
  return {
    key: nextKey(),
    name: "",
    quantity: "1",
    unit: "",
    unitPrice: "0",
    taxRate: 10,
  };
}

export function InvoiceForm({
  clients,
  defaults,
  mode,
}: {
  clients: ClientOption[];
  defaults: InvoiceFormData;
  mode: "create" | "edit";
}) {
  const action = mode === "edit" ? updateInvoiceAction : createInvoiceAction;
  const [state, formAction] = useActionState(action, {} as InvoiceState);

  const [clientId, setClientId] = useState(defaults.clientId);
  const [taxRounding, setTaxRounding] = useState<TaxRounding>(
    defaults.taxRounding,
  );
  const [items, setItems] = useState<ItemRow[]>(
    defaults.items.length
      ? defaults.items.map((it) => ({ ...it, key: nextKey() }))
      : [emptyRow()],
  );

  const totals = useMemo(
    () =>
      calcTotals(
        items.map((it) => ({
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          taxRate: it.taxRate,
        })),
        taxRounding,
      ),
    [items, taxRounding],
  );

  function updateItem(key: string, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  }
  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
    // 追加した行の品目欄へフォーカス（フォーカス移動で画面も追従する）
    setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[placeholder="品目名"]',
      );
      inputs[inputs.length - 1]?.focus();
    }, 0);
  }
  function removeItem(key: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((it) => it.key !== key),
    );
  }

  const payload = JSON.stringify({
    clientId,
    invoiceNo: defaults.invoiceNo,
    title: defaults.title,
    subject: defaults.subject,
    billingMonth: defaults.billingMonth,
    issueDate: defaults.issueDate,
    dueDate: defaults.dueDate,
    notes: defaults.notes,
    taxRounding,
    items: items.map((it) => ({
      name: it.name,
      quantity: Number(it.quantity) || 0,
      unit: it.unit,
      unitPrice: Number(it.unitPrice) || 0,
      taxRate: it.taxRate,
    })),
  });

  // payload はサーバー送信時に最新DOM値を集約するため、フォーム側で再構築する
  return (
    <form
      action={formAction}
      className="space-y-6"
      onSubmit={(e) => {
        // 送信直前に最新のDOM値＋state から payload を再構築
        const form = e.currentTarget;
        const get = (n: string) =>
          form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            `[name="${n}"]`,
          )?.value ?? "";
        const hidden = form.querySelector<HTMLInputElement>(
          'input[name="payload"]',
        );
        if (hidden) {
          hidden.value = JSON.stringify({
            clientId,
            invoiceNo: get("invoiceNo"),
            title: get("title"),
            subject: get("subject") || null,
            billingMonth: get("billingMonth"),
            issueDate: get("issueDate"),
            dueDate: get("dueDate") || null,
            notes: get("notes") || null,
            taxRounding,
            items: items.map((it) => ({
              name: it.name,
              quantity: Number(it.quantity) || 0,
              unit: it.unit || null,
              unitPrice: Number(it.unitPrice) || 0,
              taxRate: it.taxRate,
            })),
          });
        }
      }}
    >
      {mode === "edit" && defaults.id && (
        <input type="hidden" name="id" value={defaults.id} />
      )}
      <input type="hidden" name="payload" defaultValue={payload} />

      {state.error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本情報 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>請求書情報</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>取引先</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="取引先を選択" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.honorific}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-destructive">
                  取引先が未登録です。先に{" "}
                  <Link href="/clients/new" className="underline">
                    取引先を追加
                  </Link>{" "}
                  してください。
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subject">件名</Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={defaults.subject}
                placeholder="例: 2026年7月分 RPA設計開発業務支援"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" name="title" defaultValue={defaults.title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNo">請求書番号</Label>
              <Input
                id="invoiceNo"
                name="invoiceNo"
                defaultValue={defaults.invoiceNo}
              />
            </div>

            <div className="space-y-2">
              <Label>対象月</Label>
              <MonthPicker
                name="billingMonth"
                defaultValue={defaults.billingMonth}
              />
            </div>
            <div className="space-y-2">
              <Label>発行日</Label>
              <DatePicker name="issueDate" defaultValue={defaults.issueDate} />
            </div>
            <div className="space-y-2">
              <Label>お支払い期限</Label>
              <DatePicker
                name="dueDate"
                defaultValue={defaults.dueDate}
                placeholder="期限を選択（任意）"
                clearable
              />
            </div>
            <div className="space-y-2">
              <Label>消費税の端数処理</Label>
              <Select
                value={taxRounding}
                onValueChange={(v) => setTaxRounding(v as TaxRounding)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="floor">切り捨て</SelectItem>
                  <SelectItem value="round">四捨五入</SelectItem>
                  <SelectItem value="ceil">切り上げ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 合計サマリー */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>合計</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">小計（税抜）</span>
              <span className="tabular-nums">{formatYen(totals.subtotal)}</span>
            </div>
            {totals.taxLines.map((t) => (
              <div key={t.rate} className="flex justify-between">
                <span className="text-muted-foreground">
                  消費税{t.rate > 0 ? `（${t.rate}%）` : "（非課税）"}
                </span>
                <span className="tabular-nums">{formatYen(t.tax)}</span>
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between border-t pt-3">
              <span className="font-semibold">合計金額</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {formatYen(totals.total)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 明細 */}
      <Card>
        <CardHeader>
          <CardTitle>明細</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* ヘッダー（md以上） */}
          <div className="hidden gap-2 px-8 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_5rem_5rem_7rem_6rem_6rem_2rem]">
            <span>品目</span>
            <span className="text-right">数量</span>
            <span>単位</span>
            <span className="text-right">単価</span>
            <span>税率</span>
            <span className="text-right">金額</span>
            <span />
          </div>

          {items.map((it, index) => {
            const amount = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
            return (
              <div
                key={it.key}
                className="grid grid-cols-2 items-center gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-[1.5rem_1fr_5rem_5rem_7rem_6rem_6rem_2rem] md:gap-2 md:rounded-none md:border-0 md:bg-transparent md:p-0"
              >
                <div className="hidden items-center justify-center text-muted-foreground md:flex">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* モバイル: 行番号 + 削除ボタンのヘッダー */}
                <div className="col-span-2 -mb-1 flex items-center justify-between md:hidden">
                  <span className="text-xs font-semibold text-muted-foreground">
                    明細 {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-mr-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(it.key)}
                    disabled={items.length === 1}
                    aria-label="行を削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <MobileFieldLabel>品目</MobileFieldLabel>
                  <Input
                    placeholder="品目名"
                    value={it.name}
                    onChange={(e) => updateItem(it.key, { name: e.target.value })}
                  />
                </div>
                <div>
                  <MobileFieldLabel>数量</MobileFieldLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="text-right"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(it.key, { quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <MobileFieldLabel>単位</MobileFieldLabel>
                  <Input
                    placeholder="式"
                    value={it.unit}
                    onChange={(e) => updateItem(it.key, { unit: e.target.value })}
                  />
                </div>
                <div>
                  <MobileFieldLabel>単価</MobileFieldLabel>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="text-right"
                    value={it.unitPrice}
                    onChange={(e) =>
                      updateItem(it.key, { unitPrice: e.target.value })
                    }
                  />
                </div>
                <div>
                  <MobileFieldLabel>税率</MobileFieldLabel>
                  <Select
                    value={String(it.taxRate)}
                    onValueChange={(v) =>
                      updateItem(it.key, { taxRate: Number(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="8">8%</SelectItem>
                      <SelectItem value="0">非課税</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 flex items-baseline justify-between border-t pt-2 md:col-span-1 md:block md:border-0 md:pt-0 md:text-right">
                  <span className="text-xs font-medium text-muted-foreground md:hidden">
                    金額
                  </span>
                  <span className="tabular-nums text-sm font-semibold md:font-medium">
                    {formatYen(amount)}
                  </span>
                </div>
                <div className="hidden justify-end md:flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(it.key)}
                    disabled={items.length === 1}
                    aria-label="行を削除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* 行追加は常にリストの末尾（追加後にスクロールで戻らなくて済む） */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
            onClick={addItem}
          >
            <Plus className="h-4 w-4" />
            行を追加
          </Button>
        </CardContent>
      </Card>

      {/* 備考 */}
      <Card>
        <CardHeader>
          <CardTitle>備考</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="notes"
            defaultValue={defaults.notes}
            rows={3}
            placeholder="お振込手数料は御社にてご負担をお願いいたします。 など"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-4">
        <Button asChild variant="outline" type="button">
          <Link href={mode === "edit" && defaults.id ? `/invoices/${defaults.id}` : "/invoices"}>
            キャンセル
          </Link>
        </Button>
        <SubmitButton
          label={mode === "edit" ? "更新する" : "作成する"}
          disabled={clients.length === 0}
        />
      </div>
    </form>
  );
}
