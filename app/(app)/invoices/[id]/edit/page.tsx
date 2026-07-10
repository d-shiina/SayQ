import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { toDateInput } from "@/lib/utils";
import { InvoiceForm } from "../../invoice-form";
import type { TaxRounding } from "@/lib/invoice-calc";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!invoice) notFound();

  const clients = await prisma.client.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, honorific: true },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="請求書を編集"
        description={`${invoice.invoiceNo} / ${invoice.title}`}
      />
      <InvoiceForm
        clients={clients}
        mode="edit"
        defaults={{
          id: invoice.id,
          clientId: invoice.clientId,
          invoiceNo: invoice.invoiceNo,
          title: invoice.title,
          billingMonth: invoice.billingMonth,
          issueDate: toDateInput(invoice.issueDate),
          dueDate: toDateInput(invoice.dueDate),
          notes: invoice.notes ?? "",
          taxRounding: invoice.taxRounding as TaxRounding,
          items: invoice.items.map((it) => ({
            name: it.name,
            quantity: String(it.quantity),
            unit: it.unit ?? "",
            unitPrice: String(it.unitPrice),
            taxRate: it.taxRate,
          })),
        }}
      />
    </div>
  );
}
