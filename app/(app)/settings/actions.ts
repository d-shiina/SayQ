"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface SettingsState {
  ok?: boolean;
  error?: string;
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export async function updateCompanyAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const name = str(formData.get("name"));
  if (!name) return { error: "お名前を入力してください" };

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name,
      companyName: str(formData.get("companyName")),
      companyZip: str(formData.get("companyZip")),
      companyAddress: str(formData.get("companyAddress")),
      companyBuilding: str(formData.get("companyBuilding")),
      companyTel: str(formData.get("companyTel")),
      companyEmail: str(formData.get("companyEmail")),
      invoiceRegNo: str(formData.get("invoiceRegNo")),
      bankInfo: str(formData.get("bankInfo")),
      sealText: str(formData.get("sealText")),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/invoices");
  return { ok: true };
}
