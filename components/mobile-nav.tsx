"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/invoices", label: "請求書", icon: FileText },
  { href: "/clients", label: "取引先", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

/** モバイル用の下部タブナビゲーション（md未満のみ表示） */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-5", active && "drop-shadow-sm")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
