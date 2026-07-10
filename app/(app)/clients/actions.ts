"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export interface ClientState {
  error?: string;
}

function readClient(formData: FormData) {
  return {
    name: str(formData.get("name")),
    honorific: (str(formData.get("honorific")) ?? "御中") as string,
    contact: str(formData.get("contact")),
    zip: str(formData.get("zip")),
    address: str(formData.get("address")),
    building: str(formData.get("building")),
    tel: str(formData.get("tel")),
    email: str(formData.get("email")),
    note: str(formData.get("note")),
  };
}

export async function createClientAction(
  _prev: ClientState,
  formData: FormData,
): Promise<ClientState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const data = readClient(formData);
  if (!data.name) return { error: "取引先名を入力してください" };

  await prisma.client.create({
    data: { ...data, name: data.name, userId: session.userId },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientAction(
  _prev: ClientState,
  formData: FormData,
): Promise<ClientState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const id = str(formData.get("id"));
  if (!id) return { error: "対象が見つかりません" };

  const data = readClient(formData);
  if (!data.name) return { error: "取引先名を入力してください" };

  const owned = await prisma.client.findFirst({
    where: { id, userId: session.userId },
  });
  if (!owned) return { error: "対象が見つかりません" };

  await prisma.client.update({
    where: { id },
    data: { ...data, name: data.name },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClientAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;

  const id = (formData.get("id") ?? "").toString();
  if (!id) return;

  const owned = await prisma.client.findFirst({
    where: { id, userId: session.userId },
    include: { _count: { select: { invoices: true } } },
  });
  if (!owned) return;

  // 請求書が紐づく取引先は削除不可
  if (owned._count.invoices > 0) {
    redirect("/clients?error=has_invoices");
  }

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
