"use client";

import * as React from "react";
import { SHEET_WIDTH_PX } from "@/components/invoice-sheet";

/**
 * A4帳票を親幅に合わせて縮小表示する埋め込みプレビュー。
 * transform: scale でリフローさせずに縮めるため、PDFと見た目が一致する。
 */
export function SheetPreview({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const update = () => {
      const containerWidth = containerRef.current?.clientWidth ?? SHEET_WIDTH_PX;
      const s = Math.min(1, containerWidth / SHEET_WIDTH_PX);
      setScale(s);
      const sheetHeight = sheetRef.current?.offsetHeight ?? 0;
      if (sheetHeight > 0) setHeight(sheetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    if (sheetRef.current) ro.observe(sheetRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden" style={{ height }}>
      <div
        ref={sheetRef}
        style={{
          width: SHEET_WIDTH_PX,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
