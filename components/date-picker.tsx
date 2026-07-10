"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

/**
 * shadcnスタイルの日付ピッカー。
 * フォーム送信用に hidden input (name, value=yyyy-MM-dd) を持つ。
 */
export function DatePicker({
  name,
  defaultValue = "",
  placeholder = "日付を選択",
  clearable = false,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
}) {
  const [date, setDate] = React.useState<Date | undefined>(() =>
    parseDateValue(defaultValue),
  );
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <input
        type="hidden"
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              clearable && date && "pr-8",
            )}
          >
            <CalendarIcon className="size-4" />
            {date
              ? format(date, "yyyy年M月d日(EEE)", { locale: ja })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              setDate(d ?? undefined);
              setOpen(false);
            }}
            required={false}
          />
        </PopoverContent>
      </Popover>
      {clearable && date && (
        <button
          type="button"
          aria-label="クリア"
          onClick={() => setDate(undefined)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
