import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toDateInput, currentMonth } from "@/lib/utils";
import { InvoiceForm } from "../invoice-form";
import { suggestInvoiceNo } from "@/lib/invoice-no";

export default async function NewInvoicePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, honorific: true },
  });

  const billingMonth = currentMonth();
  const invoiceNo = await suggestInvoiceNo(session.userId, billingMonth);
  const today = toDateInput(new Date());

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="請求書を作成" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground">
              請求書を作成するには、まず取引先を登録してください。
            </p>
            <Button asChild>
              <Link href="/clients/new">取引先を追加</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="請求書を作成" description="明細を入力して請求書を作成します" />
      <InvoiceForm
        clients={clients}
        mode="create"
        defaults={{
          clientId: clients[0].id,
          invoiceNo,
          title: "御請求書",
          billingMonth,
          issueDate: today,
          dueDate: "",
          notes: "お振込手数料は御社にてご負担をお願いいたします。",
          taxRounding: "floor",
          items: [
            { name: "", quantity: "1", unit: "式", unitPrice: "0", taxRate: 10 },
          ],
        }}
      />
    </div>
  );
}
