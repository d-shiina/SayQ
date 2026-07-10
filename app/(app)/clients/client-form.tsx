"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
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
import { ZipAddressSearch } from "@/components/zip-address-search";
import {
  createClientAction,
  updateClientAction,
  type ClientState,
} from "./actions";

type ClientLike = {
  id: string;
  name: string;
  honorific: string;
  contact: string | null;
  zip: string | null;
  address: string | null;
  building: string | null;
  tel: string | null;
  email: string | null;
  note: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中…" : label}
    </Button>
  );
}

export function ClientForm({ client }: { client?: ClientLike }) {
  const action = client ? updateClientAction : createClientAction;
  const [state, formAction] = useActionState(action, {} as ClientState);

  return (
    <form action={formAction} className="space-y-6">
      {client && <input type="hidden" name="id" value={client.id} />}

      {state.error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>取引先情報</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">
              取引先名 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="name"
                name="name"
                defaultValue={client?.name}
                placeholder="株式会社サンプル"
                required
                className="flex-1"
              />
              <Select name="honorific" defaultValue={client?.honorific ?? "御中"}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="御中">御中</SelectItem>
                  <SelectItem value="様">様</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">担当者名</Label>
            <Input id="contact" name="contact" defaultValue={client?.contact ?? ""} placeholder="山田 太郎" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tel">電話番号</Label>
            <Input id="tel" name="tel" defaultValue={client?.tel ?? ""} placeholder="03-1234-5678" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="zip">郵便番号</Label>
            <ZipAddressSearch
              id="zip"
              name="zip"
              defaultValue={client?.zip ?? ""}
              addressInputId="address"
              className="max-w-xs"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">住所</Label>
            <Input id="address" name="address" defaultValue={client?.address ?? ""} placeholder="東京都千代田区…" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="building">建物名・部屋番号</Label>
            <Input id="building" name="building" defaultValue={client?.building ?? ""} />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">メモ</Label>
            <Textarea id="note" name="note" defaultValue={client?.note ?? ""} rows={2} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline" type="button">
          <Link href="/clients">キャンセル</Link>
        </Button>
        <SubmitButton label={client ? "更新する" : "登録する"} />
      </div>
    </form>
  );
}
