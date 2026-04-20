// ============================================================
// Journal d'audit — ADMIN uniquement
// Traçabilité RGPD des actions sensibles
// ============================================================

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  LogIn,
  FileText,
  ScanLine,
  Edit,
  Trash2,
  UserPlus,
  Key,
  Activity,
} from "lucide-react";

const PAGE_SIZE = 50;

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  LOGIN:                     { label: "Connexion",              icon: LogIn,      color: "text-blue-500 bg-blue-50" },
  REGISTER:                  { label: "Inscription",            icon: UserPlus,   color: "text-violet-500 bg-violet-50" },
  CREATE_PRESCRIPTION:       { label: "Prescription créée",     icon: FileText,   color: "text-green-600 bg-green-50" },
  UPDATE_PRESCRIPTION_STATUS:{ label: "Statut mis à jour",      icon: Edit,       color: "text-amber-500 bg-amber-50" },
  DELETE_PRESCRIPTION:       { label: "Prescription supprimée", icon: Trash2,     color: "text-red-500 bg-red-50" },
  OCR_PROCESS:               { label: "OCR traité",             icon: ScanLine,   color: "text-cyan-500 bg-cyan-50" },
  PASSWORD_RESET_REQUEST:    { label: "Réinit. mot de passe",   icon: Key,        color: "text-orange-500 bg-orange-50" },
};

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action];
  const Icon = meta?.icon ?? Activity;
  const color = meta?.color ?? "text-zinc-500 bg-zinc-100";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {meta?.label ?? action}
    </span>
  );
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; search?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) redirect("/dashboard");

  const { page: pageStr, action: actionFilter, search } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(search
      ? {
          OR: [
            { action: { contains: search, mode: "insensitive" as const } },
            { entity: { contains: search, mode: "insensitive" as const } },
            { user: { OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName:  { contains: search, mode: "insensitive" as const } },
              { email:     { contains: search, mode: "insensitive" as const } },
            ]}},
          ],
        }
      : {}),
  };

  const [logs, total, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (actionFilter) params.set("action", actionFilter);
    if (search) params.set("search", search);
    return `/dashboard/audit${params.toString() ? `?${params}` : ""}`;
  }

  function filterUrl(key: string, value: string) {
    const params = new URLSearchParams();
    if (key === "action" && value) params.set("action", value);
    if (search) params.set("search", search);
    return `/dashboard/audit${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className="p-4 sm:p-8">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-medical-600" />
          Journal d&apos;audit
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          {total.toLocaleString("fr-BE")} entrée{total !== 1 ? "s" : ""} — traçabilité RGPD
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <a
          href={filterUrl("action", "")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            !actionFilter
              ? "bg-medical-600 text-white border-medical-600"
              : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
          }`}
        >
          Toutes les actions
        </a>
        {actions.map(({ action }) => (
          <a
            key={action}
            href={filterUrl("action", action)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              actionFilter === action
                ? "bg-medical-600 text-white border-medical-600"
                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
            }`}
          >
            {ACTION_META[action]?.label ?? action}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide hidden md:table-cell">Entité</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide hidden lg:table-cell">Métadonnées</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-700/50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-400">
                    Aucune entrée d&apos;audit
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                      <div className="text-xs text-zinc-400 truncate max-w-[160px]">{log.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                      {log.entity && (
                        <span className="font-mono text-zinc-400">{log.entity}</span>
                      )}
                      {log.entityId && (
                        <div className="font-mono text-zinc-300 dark:text-zinc-600 text-[10px] truncate max-w-[120px]">
                          {log.entityId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {log.metadata && (
                        <pre className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded max-w-[200px] overflow-hidden truncate">
                          {JSON.stringify(log.metadata)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Page {page} sur {totalPages} · {total} entrée{total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-1">
              {page > 1 && (
                <a href={pageUrl(page - 1)} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all">
                  ← Précédent
                </a>
              )}
              {page < totalPages && (
                <a href={pageUrl(page + 1)} className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all">
                  Suivant →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
