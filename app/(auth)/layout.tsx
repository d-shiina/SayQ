import Link from "next/link";
import { FileText } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-accent/40 to-background px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileText className="h-6 w-6" />
        </span>
        <span className="text-2xl font-bold tracking-tight">SayQ</span>
      </Link>
      {children}
      <p className="mt-8 text-xs text-muted-foreground">
        毎月の請求書作成ツール — 帳票とフォームでかんたん請求
      </p>
    </div>
  );
}
