import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteClientAction } from "./actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="取引先" description="請求先の一覧・管理">
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            取引先を追加
          </Link>
        </Button>
      </PageHeader>

      {searchParams.error === "has_invoices" && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          請求書が紐づいている取引先は削除できません。
        </p>
      )}

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              取引先がまだありません。最初の取引先を追加しましょう。
            </p>
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                取引先を追加
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>取引先名</TableHead>
                <TableHead>担当者</TableHead>
                <TableHead className="hidden md:table-cell">連絡先</TableHead>
                <TableHead className="text-right">請求書数</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.name}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {c.honorific}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.contact ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {c.tel ?? c.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c._count.invoices}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/clients/${c.id}/edit`} aria-label="編集">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <form action={deleteClientAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          aria-label="削除"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
