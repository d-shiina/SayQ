import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background print:block print:min-h-0 print:bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/80 px-4 backdrop-blur md:px-6">
          <div className="text-sm text-muted-foreground">
            {user.companyName || user.name}
          </div>
          <UserMenu name={user.name} email={user.email} />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
