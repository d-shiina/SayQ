import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import { formatYen, formatDateJa, formatBillingMonth } from "@/lib/utils";
import { statusMeta } from "@/lib/invoice-status";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthFilter } from "./month-filter";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const month = searchParams.month;

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: session.userId,
      ...(month ? { billingMonth: month } : {}),
    },
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    include: { client: true, items: true },
  });

  // 対象月の選択肢
  const allMonths = await prisma.invoice.findMany({
    where: { userId: session.userId },
    select: { billingMonth: true },
    distinct: ["billingMonth"],
    orderBy: { billingMonth: "desc" },
  });
  const months = allMonths.map((m) => m.billingMonth);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="請求書" description="作成した請求書の一覧">
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            請求書を作成
          </Link>
        </Button>
      </PageHeader>

      {months.length > 0 && (
        <div className="mb-4">
          <MonthFilter months={months} value={month ?? ""} />
        </div>
      )}

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {month
                ? `${formatBillingMonth(month)}の請求書はありません。`
                : "請求書がまだありません。最初の請求書を作成しましょう。"}
            </p>
            <Button asChild>
              <Link href="/invoices/new">
                <Plus className="h-4 w-4" />
                請求書を作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>請求書番号</TableHead>
                <TableHead>取引先</TableHead>
                <TableHead className="hidden sm:table-cell">対象月</TableHead>
                <TableHead className="hidden md:table-cell">発行日</TableHead>
                <TableHead className="text-right">金額（税込）</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const totals = calcTotals(
                  inv.items,
                  inv.taxRounding as TaxRounding,
                );
                const meta = statusMeta(inv.status);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {inv.client.name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        {inv.client.honorific}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatBillingMonth(inv.billingMonth)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDateJa(inv.issueDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatYen(totals.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
