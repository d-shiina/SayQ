import { PageHeader } from "@/components/page-header";
import { ClientForm } from "../client-form";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="取引先を追加" description="新しい請求先を登録します" />
      <ClientForm />
    </div>
  );
}
