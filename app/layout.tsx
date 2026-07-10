import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

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
    <html lang="ja" className={notoSansJp.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
