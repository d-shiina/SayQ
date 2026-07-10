import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { calcTotals, type TaxRounding } from "@/lib/invoice-calc";
import {
  formatYen,
  formatDateJa,
  formatBillingMonth,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { InvoiceToolbar } from "./invoice-toolbar";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!invoice) notFound();

  const totals = calcTotals(invoice.items, invoice.taxRounding as TaxRounding);
  const pdfUrl = `/invoices/${invoice.id}/pdf`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          請求書一覧へ戻る
        </Link>
      </div>

      <InvoiceToolbar id={invoice.id} status={invoice.status} />

      {/* サマリー */}
      <Card className="mb-6">
        <CardContent className="grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">請求先</div>
            <div className="mt-0.5 font-medium">
              {invoice.client.name}
              <span className="ml-1 text-xs text-muted-foreground">
                {invoice.client.honorific}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">件名</div>
            <div className="mt-0.5 font-medium">
              {invoice.subject || `${formatBillingMonth(invoice.billingMonth)}分`}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">
              請求日 / 入金期日
            </div>
            <div className="mt-0.5 font-medium">
              {formatDateJa(invoice.issueDate)}
              {invoice.dueDate && (
                <span className="text-muted-foreground">
                  {" "}
                  → {formatDateJa(invoice.dueDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 sm:block">
            <div>
              <div className="text-xs text-muted-foreground">請求金額（税込）</div>
              <div className="mt-0.5 text-lg font-bold tabular-nums text-primary">
                {formatYen(totals.total)}
              </div>
            </div>
            <div className="sm:mt-1">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDFプレビュー（デスクトップ） */}
      <div className="hidden md:block">
        <object
          data={`${pdfUrl}#toolbar=0&navpanes=0`}
          type="application/pdf"
          className="h-[78vh] w-full rounded-xl border bg-white shadow-sm"
        >
          <PdfFallback pdfUrl={pdfUrl} />
        </object>
      </div>

      {/* モバイルはダウンロード導線のみ */}
      <div className="md:hidden">
        <PdfFallback pdfUrl={pdfUrl} />
      </div>
    </div>
  );
}

function PdfFallback({ pdfUrl }: { pdfUrl: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <FileText className="h-7 w-7" />
        </span>
        <p className="text-sm text-muted-foreground">
          請求書はPDFで発行されます。
          <br />
          ダウンロードしてご確認・送付ください。
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={pdfUrl} target="_blank" rel="noopener">
              <FileText className="h-4 w-4" />
              プレビュー
            </a>
          </Button>
          <Button asChild>
            <a href={`${pdfUrl}?dl=1`}>
              <Download className="h-4 w-4" />
              PDFダウンロード
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
