import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  FileText,
  Clock,
  CircleDollarSign,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import {
  formatYen,
  formatDateJa,
  formatBillingMonth,
  currentMonth,
} from "@/lib/utils";
import { statusMeta } from "@/lib/invoice-status";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const month = currentMonth();

  const [invoices, clientCount] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { client: true, items: true },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.client.count({ where: { userId: user.id } }),
  ]);

  const withTotal = invoices.map((inv) => ({
    inv,
    total: calcTotals(inv.items, inv.taxRounding as TaxRounding).total,
  }));

  const thisMonthTotal = withTotal
    .filter((x) => x.inv.billingMonth === month)
    .reduce((s, x) => s + x.total, 0);

  const unpaidTotal = withTotal
    .filter((x) => x.inv.status !== "paid")
    .reduce((s, x) => s + x.total, 0);

  const recent = withTotal.slice(0, 6);

  const companyName = user.companyName || user.name;
  const needsSetup = !user.companyName || !user.companyAddress;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="ダッシュボード"
        description={`${companyName} の請求状況`}
      >
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            請求書を作成
          </Link>
        </Button>
      </PageHeader>

      {needsSetup && (
        <Card className="mb-6 border-primary/30 bg-accent/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm">
              まず自社情報を設定すると、請求書に発行元・振込先が反映されます。
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings">自社情報を設定</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* サマリーカード */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CircleDollarSign className="h-5 w-5" />}
          label={`今月（${formatBillingMonth(month)}）の請求`}
          value={formatYen(thisMonthTotal)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="未入金の合計"
          value={formatYen(unpaidTotal)}
          accent="warning"
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="請求書 / 取引先"
          value={`${invoices.length} 件 / ${clientCount} 社`}
        />
      </div>

      {/* 最近の請求書 */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>最近の請求書</CardTitle>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            すべて見る
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <FileText className="h-9 w-9 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                まだ請求書がありません。
              </p>
              <Button asChild size="sm">
                <Link href="/invoices/new">請求書を作成</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map(({ inv, total }) => {
                const meta = statusMeta(inv.status);
                return (
                  <li key={inv.id}>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {inv.client.name}
                          <span className="ml-1 text-xs text-muted-foreground">
                            {inv.client.honorific}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {inv.invoiceNo} · {formatDateJa(inv.issueDate)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        <span className="w-24 text-right font-medium tabular-nums">
                          {formatYen(total)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className={
            "flex h-11 w-11 items-center justify-center rounded-lg " +
            (accent === "warning"
              ? "bg-amber-100 text-amber-600"
              : "bg-accent text-primary")
          }
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
