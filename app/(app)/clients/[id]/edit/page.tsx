import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "../../client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, userId: session.userId },
  });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="取引先を編集" description={client.name} />
      <ClientForm client={client} />
    </div>
  );
}
