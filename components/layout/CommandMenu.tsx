"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  FileText,
  User,
  Loader2,
  LayoutDashboard,
  ScanLine,
  Users,
  Plus,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SCHEDULED: "Planifié",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
};

interface SearchResults {
  patients: { id: string; firstName: string; lastName: string; email: string }[];
  prescriptions: {
    id: string;
    examType: string;
    status: string;
    createdAt: string;
    patient: { firstName: string; lastName: string };
  }[];
}

interface CommandMenuProps {
  role: "ADMIN" | "DOCTOR" | "PATIENT";
}

export function CommandMenu({ role }: CommandMenuProps) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ patients: [], prescriptions: [] });
  const router = useRouter();

  // ── Raccourci Cmd+K / Ctrl+K ────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ── Recherche avec debounce ──────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({ patients: [], prescriptions: [] }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const isDoctor = role === "DOCTOR" || role === "ADMIN";

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all border border-zinc-200 dark:border-zinc-700"
    >
      <Search className="w-3.5 h-3.5" />
      <span>Rechercher…</span>
      <kbd className="ml-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-1 py-0.5">⌘K</kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { setOpen(false); setQuery(""); }}
      />

      {/* Palette */}
      <Command
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        shouldFilter={false}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          {loading
            ? <Loader2 className="w-4 h-4 text-zinc-400 animate-spin flex-shrink-0" />
            : <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          }
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Rechercher patients, prescriptions…"
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
            autoFocus
          />
          <kbd
            onClick={() => { setOpen(false); setQuery(""); }}
            className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 cursor-pointer"
          >
            Esc
          </kbd>
        </div>

        <Command.List className="max-h-80 overflow-y-auto py-2">
          {/* Navigation rapide */}
          {query.length < 2 && (
            <Command.Group heading={<span className="px-4 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Navigation</span>}>
              <Item icon={<LayoutDashboard className="w-4 h-4" />} label="Tableau de bord" onSelect={() => go("/dashboard")} />
              <Item icon={<FileText className="w-4 h-4" />} label="Mes prescriptions" onSelect={() => go("/dashboard/prescriptions")} />
              {role === "PATIENT" && <Item icon={<ScanLine className="w-4 h-4" />} label="Numériser une ordonnance" onSelect={() => go("/dashboard/upload")} />}
              {isDoctor && <Item icon={<Users className="w-4 h-4" />} label="Patients" onSelect={() => go("/dashboard/patients")} />}
              {isDoctor && <Item icon={<Plus className="w-4 h-4" />} label="Nouvelle prescription" onSelect={() => go("/dashboard/prescriptions/new")} />}
            </Command.Group>
          )}

          {/* Résultats patients */}
          {results.patients.length > 0 && (
            <Command.Group heading={<span className="px-4 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Patients</span>}>
              {results.patients.map((p) => (
                <Item
                  key={p.id}
                  icon={<User className="w-4 h-4" />}
                  label={`${p.firstName} ${p.lastName}`}
                  sub={p.email}
                  onSelect={() => go(`/dashboard/patients/${p.id}`)}
                />
              ))}
            </Command.Group>
          )}

          {/* Résultats prescriptions */}
          {results.prescriptions.length > 0 && (
            <Command.Group heading={<span className="px-4 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Prescriptions</span>}>
              {results.prescriptions.map((pr) => (
                <Item
                  key={pr.id}
                  icon={<FileText className="w-4 h-4" />}
                  label={pr.examType}
                  sub={`${pr.patient.firstName} ${pr.patient.lastName} — ${STATUS_LABELS[pr.status] ?? pr.status}`}
                  onSelect={() => go(`/dashboard/prescriptions/${pr.id}`)}
                />
              ))}
            </Command.Group>
          )}

          {query.length >= 2 && !loading && results.patients.length === 0 && results.prescriptions.length === 0 && (
            <Command.Empty className="py-8 text-center text-sm text-zinc-400">
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </Command.Empty>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function Item({
  icon,
  label,
  sub,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm
        text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800
        aria-selected:bg-medical-50 dark:aria-selected:bg-zinc-800 aria-selected:text-medical-700 dark:aria-selected:text-medical-400
        transition-colors"
    >
      <span className="text-zinc-400 dark:text-zinc-500 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="truncate">{label}</div>
        {sub && <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{sub}</div>}
      </div>
    </Command.Item>
  );
}
