"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function parseYm(value: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * 年月ピッカー（請求書の対象月用）。
 * フォーム送信用に hidden input (name, value=YYYY-MM) を持つ。
 */
export function MonthPicker({
  name,
  defaultValue = "",
  className,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  const initial = parseYm(defaultValue);
  const [selected, setSelected] = React.useState(initial);
  const [viewYear, setViewYear] = React.useState(initial.year);
  const [open, setOpen] = React.useState(false);

  const value = `${selected.year}-${String(selected.month).padStart(2, "0")}`;

  return (
    <div className={className}>
      <input type="hidden" name={name} value={value} />
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (o) setViewYear(selected.year);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarDays className="size-4" />
            {selected.year}年{selected.month}月
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="前年"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">{viewYear}年</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="翌年"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isSelected =
                selected.year === viewYear && selected.month === m;
              const now = new Date();
              const isCurrent =
                now.getFullYear() === viewYear && now.getMonth() + 1 === m;
              return (
                <Button
                  key={m}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 font-normal",
                    !isSelected && isCurrent && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => {
                    setSelected({ year: viewYear, month: m });
                    setOpen(false);
                  }}
                >
                  {m}月
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
