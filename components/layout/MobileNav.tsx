"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Menu, X, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  navLinks: NavLink[];
  userName: string;
  userRole: string;
  logoutAction: () => Promise<void>;
}

export function MobileNav({ navLinks, userName, userRole, logoutAction }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Top bar mobile ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-zinc-100 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="w-7 h-7 rounded-lg gradient-medical flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-bold text-sm text-zinc-900">Antigravity</span>
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          aria-label="Menu"
        >
          {open ? <X className="w-5 h-5 text-zinc-700" /> : <Menu className="w-5 h-5 text-zinc-700" />}
        </button>
      </div>

      {/* ── Overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer mobile ── */}
      <div
        className={`lg:hidden fixed top-14 left-0 bottom-0 z-40 w-72 bg-white border-r border-zinc-100 flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
            >
              <link.icon className="w-4 h-4 text-zinc-400 group-hover:text-medical-600 transition-colors flex-shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-zinc-50 rounded-lg">
            <div className="w-7 h-7 rounded-lg gradient-medical flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userName[0]}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-900 truncate">{userName}</div>
              <div className="text-xs text-zinc-500">{userRole}</div>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
