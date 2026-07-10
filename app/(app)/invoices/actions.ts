"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { suggestInvoiceNo } from "@/lib/invoice-no";

const itemSchema = z.object({
  name: z.string().min(1, "品目名を入力してください"),
  quantity: z.coerce.number().finite(),
  unit: z.string().optional().nullable(),
  unitPrice: z.coerce.number().finite(),
  taxRate: z.coerce.number().int(),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "取引先を選択してください"),
  invoiceNo: z.string().min(1, "請求書番号を入力してください"),
  title: z.string().min(1, "タイトルを入力してください"),
  subject: z.string().optional().nullable(),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/, "対象月を選択してください"),
  issueDate: z.string().min(1, "発行日を入力してください"),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  taxRounding: z.enum(["floor", "round", "ceil"]),
  items: z.array(itemSchema).min(1, "明細を1件以上入力してください"),
});

export interface InvoiceState {
  error?: string;
}

function parsePayload(formData: FormData) {
  const raw = formData.get("payload");
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createInvoiceAction(
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const parsed = invoiceSchema.safeParse(parsePayload(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }
  const data = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId: session.userId },
  });
  if (!client) return { error: "取引先が見つかりません" };

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.userId,
      clientId: data.clientId,
      invoiceNo: data.invoiceNo,
      title: data.title,
      subject: data.subject || null,
      billingMonth: data.billingMonth,
      issueDate: new Date(data.issueDate),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes: data.notes || null,
      taxRounding: data.taxRounding,
      items: {
        create: data.items.map((it, i) => ({
          name: it.name,
          quantity: it.quantity,
          unit: it.unit || null,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoiceAction(
  _prev: InvoiceState,
  formData: FormData,
): Promise<InvoiceState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const id = (formData.get("id") ?? "").toString();
  if (!id) return { error: "対象が見つかりません" };

  const owned = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
  });
  if (!owned) return { error: "対象が見つかりません" };

  const parsed = invoiceSchema.safeParse(parsePayload(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "入力内容を確認してください" };
  }
  const data = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: data.clientId, userId: session.userId },
  });
  if (!client) return { error: "取引先が見つかりません" };

  // 明細は入れ替え（全削除→再作成）
  await prisma.$transaction([
    prisma.invoiceItem.deleteMany({ where: { invoiceId: id } }),
    prisma.invoice.update({
      where: { id },
      data: {
        clientId: data.clientId,
        invoiceNo: data.invoiceNo,
        title: data.title,
        subject: data.subject || null,
        billingMonth: data.billingMonth,
        issueDate: new Date(data.issueDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
        taxRounding: data.taxRounding,
        items: {
          create: data.items.map((it, i) => ({
            name: it.name,
            quantity: it.quantity,
            unit: it.unit || null,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            sortOrder: i,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  redirect(`/invoices/${id}`);
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = (formData.get("id") ?? "").toString();
  const status = (formData.get("status") ?? "").toString();
  if (!id || !["draft", "sent", "paid"].includes(status)) return;

  const owned = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
  });
  if (!owned) return;

  await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
}

export async function deleteInvoiceAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = (formData.get("id") ?? "").toString();
  if (!id) return;

  const owned = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
  });
  if (!owned) return;

  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}

/** 既存請求書を複製（翌月請求などに便利） */
export async function duplicateInvoiceAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = (formData.get("id") ?? "").toString();
  if (!id) return;

  const src = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
    include: { items: true },
  });
  if (!src) return;

  const newNo = await suggestInvoiceNo(session.userId, src.billingMonth);

  const copy = await prisma.invoice.create({
    data: {
      userId: session.userId,
      clientId: src.clientId,
      invoiceNo: newNo,
      title: src.title,
      subject: src.subject,
      billingMonth: src.billingMonth,
      // 他の日付と同様に date-only（UTC深夜）へ正規化して保存する
      issueDate: new Date(new Date().toISOString().slice(0, 10)),
      dueDate: src.dueDate,
      notes: src.notes,
      taxRounding: src.taxRounding,
      status: "draft",
      items: {
        create: src.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          sortOrder: it.sortOrder,
        })),
      },
    },
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${copy.id}/edit`);
}
