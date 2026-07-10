import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="自社情報設定"
        description="請求書に表示される発行元情報を設定します"
      />
      <SettingsForm user={user} />
    </div>
  );
}
