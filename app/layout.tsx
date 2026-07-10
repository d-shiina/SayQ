import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SayQ | 請求書作成ツール",
  description: "毎月の請求書をかんたんに作成・管理。freeeライクな帳票とフォーム。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
