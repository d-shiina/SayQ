import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { InvoiceSheet } from "@/components/invoice-sheet";
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

  return (
    <div className="mx-auto max-w-[210mm]">
      <div className="no-print mb-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          請求書一覧へ戻る
        </Link>
      </div>

      <InvoiceToolbar id={invoice.id} status={invoice.status} />

      <div className="print-area">
        <InvoiceSheet invoice={invoice} company={user} />
      </div>
    </div>
  );
}
