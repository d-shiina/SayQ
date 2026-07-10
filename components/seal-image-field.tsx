"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 240; // 最長辺 px（帳票表示は 64px 程度なので十分）

/** File → 縮小済み data URL（PNG、透過保持） */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas unavailable"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像を読み込めませんでした"));
    };
    img.src = url;
  });
}

/**
 * 角印画像のアップロードフィールド。
 * hidden input (name="sealImage") に縮小済み data URL を保持してフォーム送信する。
 */
export function SealImageField({
  defaultValue,
}: {
  defaultValue: string | null;
}) {
  const [image, setImage] = React.useState<string>(defaultValue ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルの再選択を許可
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }
    setError(null);
    try {
      setImage(await fileToDataUrl(file));
    } catch {
      setError("画像の読み込みに失敗しました");
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="sealImage" value={image} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed bg-muted/30">
          {image ? (
            // data URL のプレビュー（次サイズ最適化不要のため素の img を使用）
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt="角印プレビュー"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="px-2 text-center text-[10px] leading-tight text-muted-foreground">
              画像なし
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            {image ? "画像を変更" : "画像をアップロード"}
          </Button>
          {image && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setImage("")}
            >
              <Trash2 className="size-4" />
              削除
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        PNG推奨（透過対応）。自動で縮小されます。未設定の場合は下の角印テキストが使われます。
      </p>
    </div>
  );
}
