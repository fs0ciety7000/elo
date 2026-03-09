// ============================================================
// Layout du Dashboard — Antigravity Medical SaaS
// Barre de navigation latérale + header top avec info utilisateur
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutUser } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/utils";
import { MobileNav } from "@/components/layout/MobileNav";
import {
  Activity,
  LayoutDashboard,
  FileText,
  ScanLine,
  User,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Role } from "@prisma/client";

// ── Liens de navigation selon le rôle ────────────────────────
function getNavLinks(role: Role) {
  const common = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/dashboard/profile", label: "Mon profil", icon: User },
  ];

  if (role === Role.PATIENT) {
    common.splice(2, 0, {
      href: "/dashboard/upload",
      label: "Numériser une ordonnance",
      icon: ScanLine,
    });
  }

  if (role === Role.DOCTOR || role === Role.ADMIN) {
    common.splice(2, 0, {
      href: "/dashboard/prescriptions/new",
      label: "Nouvelle prescription",
      icon: FileText,
    });
    common.splice(2, 0, {
      href: "/dashboard/patients",
      label: "Patients",
      icon: Users,
    });
  }

  return common;
}

// ── Composant Layout ─────────────────────────────────────────
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const navLinks = getNavLinks(session.role);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* ── Navigation mobile (hamburger + drawer) ── */}
      <MobileNav
        navLinks={navLinks}
        userName={`${session.firstName} ${session.lastName}`}
        userRole={ROLE_LABELS[session.role]}
        logoutAction={logoutUser}
      />

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-zinc-100 flex-col fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-medical flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base text-zinc-900">
              Antigravity
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600
                hover:bg-zinc-50 hover:text-zinc-900 transition-all group"
            >
              <link.icon className="w-4 h-4 text-zinc-400 group-hover:text-medical-600 transition-colors flex-shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Info utilisateur + déconnexion */}
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-zinc-50 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-medical-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-900 truncate">
                {session.firstName} {session.lastName}
              </div>
              <div className="text-xs text-zinc-500 truncate">
                {ROLE_LABELS[session.role]}
              </div>
            </div>
          </div>
          <form action={logoutUser}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
