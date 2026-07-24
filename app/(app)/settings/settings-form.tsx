"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ZipAddressSearch } from "@/components/zip-address-search";
import { SealImageField } from "@/components/seal-image-field";
import { updateCompanyAction, type SettingsState } from "./actions";

type UserLike = {
  name: string;
  companyName: string | null;
  companyZip: string | null;
  companyAddress: string | null;
  companyBuilding: string | null;
  companyTel: string | null;
  companyEmail: string | null;
  invoiceRegNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bankAccountType: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  bankInfo: string | null;
  sealText: string | null;
  sealImage: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中…" : "保存する"}
    </Button>
  );
}

function Field({
  id,
  label,
  defaultValue,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} defaultValue={defaultValue ?? ""} {...rest} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SettingsForm({ user }: { user: UserLike }) {
  const initial: SettingsState = {};
  const [state, formAction] = useActionState(updateCompanyAction, initial);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.ok || state.error) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <div ref={topRef} />
      {state.ok && (
        <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          保存しました
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>
            請求書の発行元（自社）として帳票に印字されます
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="companyName" label="会社名・屋号" defaultValue={user.companyName} />
          <Field id="name" label="担当者名・代表者名" defaultValue={user.name} required />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="companyZip">郵便番号</Label>
            <ZipAddressSearch
              id="companyZip"
              name="companyZip"
              defaultValue={user.companyZip ?? ""}
              addressInputId="companyAddress"
              className="max-w-xs"
            />
          </div>
          <Field
            id="companyAddress"
            label="住所"
            defaultValue={user.companyAddress}
            placeholder="東京都渋谷区神宮前1-2-3"
            className="sm:col-span-2"
          />
          <Field
            id="companyBuilding"
            label="建物名・部屋番号"
            defaultValue={user.companyBuilding}
            className="sm:col-span-2"
          />
          <Field id="companyTel" label="電話番号" defaultValue={user.companyTel} placeholder="03-1234-5678" />
          <Field id="companyEmail" label="メールアドレス" defaultValue={user.companyEmail} type="email" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>請求・支払情報</CardTitle>
          <CardDescription>
            インボイス登録番号や振込先を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="invoiceRegNo"
            label="インボイス登録番号"
            defaultValue={user.invoiceRegNo}
            placeholder="T1234567890123"
            hint="適格請求書発行事業者の登録番号（任意）"
          />
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">振込先</p>
              <p className="text-xs text-muted-foreground">
                項目ごとに入力すると、帳票に表記ゆれなく表示されます
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="bankName"
                label="銀行名"
                defaultValue={user.bankName}
                placeholder="PayPay銀行"
              />
              <Field
                id="bankBranch"
                label="支店名"
                defaultValue={user.bankBranch}
                placeholder="ビジネス営業部"
              />
              <div className="space-y-2">
                <Label htmlFor="bankAccountType">口座種別</Label>
                <select
                  id="bankAccountType"
                  name="bankAccountType"
                  defaultValue={user.bankAccountType ?? ""}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">選択してください</option>
                  <option value="普通">普通</option>
                  <option value="当座">当座</option>
                </select>
              </div>
              <Field
                id="bankAccountNumber"
                label="口座番号"
                defaultValue={user.bankAccountNumber}
                placeholder="1234567"
                inputMode="numeric"
              />
              <Field
                id="bankAccountHolder"
                label="口座名義"
                defaultValue={user.bankAccountHolder}
                placeholder="カ）サンプル"
                className="sm:col-span-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>角印</CardTitle>
          <CardDescription>
            請求書の右上に表示される印影を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>角印画像</Label>
            <SealImageField defaultValue={user.sealImage} />
          </div>
          <Field
            id="sealText"
            label="角印テキスト"
            defaultValue={user.sealText}
            placeholder="サンプル"
            hint="画像を設定しない場合、このテキストが朱色の角印風に表示されます（最大4文字程度）"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
