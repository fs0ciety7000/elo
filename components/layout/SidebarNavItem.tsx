"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ScanLine,
  User,
  Users,
  Stethoscope,
  Calendar,
  ClipboardList,
} from "lucide-react";

const ICON_COMPONENTS = {
  LayoutDashboard,
  FileText,
  ScanLine,
  User,
  Users,
  Stethoscope,
  Calendar,
  ClipboardList,
} as const;

export type IconName = keyof typeof ICON_COMPONENTS;

interface Props {
  href: string;
  label: string;
  icon: IconName;
}

export function SidebarNavItem({ href, label, icon }: Props) {
  const pathname = usePathname();
  // Dashboard exact match; others prefix match (e.g. /dashboard/patients/*)
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const Icon = ICON_COMPONENTS[icon];

  return (
    <Link
      href={href}
      className={[
        "relative flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-blue-600/[0.13] text-blue-300 dark:bg-blue-500/[0.13] dark:text-[#84acf4]"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
      ].join(" ")}
    >
      {/* Accent bar gauche — visible seulement sur l'item actif */}
      {isActive && (
        <span
          aria-hidden
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-[3px] h-[22px] rounded-r-sm bg-medical-500 dark:bg-[#4480e6]"
        />
      )}
      <Icon
        className={[
          "w-[18px] h-[18px] flex-shrink-0 transition-colors",
          isActive
            ? "text-medical-500 dark:text-[#4480e6]"
            : "text-zinc-400 dark:text-zinc-500 group-hover:text-medical-600",
        ].join(" ")}
      />
      {label}
    </Link>
  );
}
