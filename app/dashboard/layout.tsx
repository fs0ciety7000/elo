// ============================================================
// Layout du Dashboard — HumaScan Medical SaaS
// Barre de navigation latérale + header top avec info utilisateur
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutUser } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/utils";
import { MobileNav, type IconName } from "@/components/layout/MobileNav";
import { SidebarNavItem } from "@/components/layout/SidebarNavItem";
import Image from "next/image";
import { LogOut, ShieldCheck } from "lucide-react";
import { Role } from "@prisma/client";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { CommandMenu } from "@/components/layout/CommandMenu";

// ── Liens de navigation selon le rôle ────────────────────────
// icon est un string (IconName) pour pouvoir être sérialisé vers le Client Component
function getNavLinks(role: Role): { href: string; label: string; icon: IconName }[] {
  const common: { href: string; label: string; icon: IconName }[] = [
    { href: "/dashboard", label: "Tableau de bord", icon: "LayoutDashboard" },
    { href: "/dashboard/prescriptions", label: "Prescriptions", icon: "FileText" },
    { href: "/dashboard/profile", label: "Mon profil", icon: "User" },
  ];

  if (role === Role.PATIENT) {
    common.splice(2, 0, {
      href: "/dashboard/upload",
      label: "Numériser une ordonnance",
      icon: "ScanLine",
    });
    common.splice(3, 0, {
      href: "/dashboard/praticiens",
      label: "Mes praticiens",
      icon: "Stethoscope",
    });
  }

  if (role === Role.DOCTOR || role === Role.ADMIN) {
    common.splice(2, 0, {
      href: "/dashboard/prescriptions/new",
      label: "Nouvelle prescription",
      icon: "FileText",
    });
    common.splice(2, 0, {
      href: "/dashboard/patients",
      label: "Patients",
      icon: "Users",
    });
  }

  if (role === Role.ADMIN) {
    common.push({
      href: "/dashboard/audit",
      label: "Journal d'audit",
      icon: "ClipboardList",
    });
  }

  if (role === Role.SECRETARY) {
    common.splice(2, 0, {
      href: "/dashboard/rendez-vous/new",
      label: "Nouveau rendez-vous",
      icon: "Calendar",
    });
    common.splice(2, 0, {
      href: "/dashboard/patients",
      label: "Patients",
      icon: "Users",
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* ── Navigation mobile (hamburger + drawer) ── */}
      <MobileNav
        navLinks={navLinks}
        userName={`${session.firstName} ${session.lastName}`}
        userRole={ROLE_LABELS[session.role]}
      />

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-700 flex-col fixed top-0 left-0 h-full z-30">
        {/* Logo */}
        <div className="p-6 pb-5 border-b border-zinc-100 dark:border-zinc-700/60">
          <Link href="/dashboard" className="flex items-center gap-[11px]">
            <div className="w-[34px] h-[34px] rounded-[10px] gradient-medical flex items-center justify-center shadow-[0_4px_14px_-4px_rgba(37,99,235,0.5)] flex-shrink-0">
              <Image src="/logo.svg" alt="HumaScan" width={20} height={20} className="brightness-0 invert" />
            </div>
            <span className="font-display font-extrabold text-[17px] tracking-tight text-zinc-900 dark:text-zinc-100">
              HumaScan
            </span>
          </Link>
        </div>

        {/* Recherche Cmd+K */}
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700/60">
          <CommandMenu role={session.role} />
        </div>

        {/* Navigation — overflow visible pour l'accent bar */}
        <nav className="flex-1 p-4 overflow-y-auto overflow-x-visible custom-scrollbar">
          <div className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <SidebarNavItem
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
              />
            ))}
          </div>
        </nav>

        {/* Info utilisateur + déconnexion */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-700/60">
          <div className="flex items-center justify-between mb-2 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700/70 rounded-[13px]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-[34px] h-[34px] rounded-[9px] bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-medical-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                  {session.firstName} {session.lastName}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {ROLE_LABELS[session.role]}
                </div>
              </div>
            </div>
            <DarkModeToggle />
          </div>
          <form action={logoutUser}>
            <button
              type="submit"
              className="w-full flex items-center gap-[11px] px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-[11px] transition-all font-medium"
            >
              <LogOut className="w-[18px] h-[18px]" />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 dark:[background:radial-gradient(ellipse_80%_40%_at_50%_-5%,rgba(37,99,235,0.05)_0%,transparent_100%),rgb(var(--zinc-950))]">
        {children}
      </main>
    </div>
  );
}
