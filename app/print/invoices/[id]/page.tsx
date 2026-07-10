import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { InvoiceSheet } from "@/components/invoice-sheet";

// ヘッドレスChromiumがPDF化するための帳票専用ページ（アプリUIなし）
export default async function PrintInvoicePage({
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
    <div className="bg-white">
      <InvoiceSheet invoice={invoice} company={user} />
    </div>
  );
}
