import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { InvoicePdf } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: {
      client: true,
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!invoice) {
    return new Response("Not Found", { status: 404 });
  }

  const buffer = await renderToBuffer(
    <InvoicePdf
      data={{
        invoiceNo: invoice.invoiceNo,
        title: invoice.title,
        subject: invoice.subject,
        billingMonth: invoice.billingMonth,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes,
        taxRounding: invoice.taxRounding,
        items: invoice.items,
        client: invoice.client,
        company: user,
      }}
    />,
  );

  // 例: 御請求書_INV-202607-001.pdf（番号が既に INV- で始まる場合は重複させない）
  const no = invoice.invoiceNo.startsWith("INV-")
    ? invoice.invoiceNo
    : `INV-${invoice.invoiceNo}`;
  const filename = `御請求書_${no}.pdf`;
  const encoded = encodeURIComponent(filename);
  const download = req.nextUrl.searchParams.get("dl") === "1";

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encoded}`,
      "Cache-Control": "no-store",
    },
  });
}
