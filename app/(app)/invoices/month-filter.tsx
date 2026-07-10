"use client";

import { useRouter } from "next/navigation";
import { formatBillingMonth } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MonthFilter({
  months,
  value,
}: {
  months: string[];
  value: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">対象月:</span>
      <Select
        value={value || "all"}
        onValueChange={(v) => {
          if (v === "all") router.push("/invoices");
          else router.push(`/invoices?month=${v}`);
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          {months.map((m) => (
            <SelectItem key={m} value={m}>
              {formatBillingMonth(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
