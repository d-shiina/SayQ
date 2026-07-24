import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
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
          <div className="flex min-w-0 items-center gap-2">
            {/* モバイルではサイドバーが無いためブランドを表示（デスクトップはサイドバー側に表示） */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground md:hidden">
              <FileText className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight md:hidden">
              SayQ
            </span>
          </div>
          <UserMenu name={user.name} email={user.email} />
        </header>
        {/* モバイルは下部ナビの高さぶん余白を確保 */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 lg:p-8 print:p-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
