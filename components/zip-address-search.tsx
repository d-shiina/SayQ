"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * 郵便番号入力＋住所検索。
 * zipcloud API (日本郵便データ) で検索し、addressInputId の input に住所を自動入力する。
 */
export function ZipAddressSearch({
  name,
  id,
  defaultValue = "",
  addressInputId,
  className,
}: {
  name: string;
  id: string;
  defaultValue?: string;
  addressInputId: string;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function search() {
    const raw = inputRef.current?.value ?? "";
    const zip = raw.replace(/[^0-9]/g, "");
    if (zip.length !== 7) {
      setError("郵便番号は7桁で入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`,
      );
      const data = await res.json();
      const r = data?.results?.[0];
      if (!r) {
        setError("該当する住所が見つかりませんでした");
        return;
      }
      const address = `${r.address1}${r.address2}${r.address3}`;
      const el = document.getElementById(
        addressInputId,
      ) as HTMLInputElement | null;
      if (el) {
        el.value = address;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.focus();
      }
    } catch {
      setError("住所検索に失敗しました。時間をおいて再度お試しください");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          defaultValue={defaultValue}
          placeholder="100-0001"
          inputMode="numeric"
          autoComplete="postal-code"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={search}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          住所検索
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
