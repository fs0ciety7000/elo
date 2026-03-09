"use client";

import { useState } from "react";
import { BookTemplate, Trash2, ChevronDown, Check } from "lucide-react";
import { deleteTemplate } from "@/lib/actions/templates";

interface Template {
  id: string;
  name: string;
  examType: string;
  examDetails: string | null;
  diagnosis: string | null;
  notes: string | null;
  urgency: boolean;
}

interface TemplateSelectorProps {
  templates: Template[];
  onApply: (t: Template) => void;
}

export function TemplateSelector({ templates, onApply }: TemplateSelectorProps) {
  const [open, setOpen]       = useState(false);
  const [applied, setApplied] = useState<string | null>(null);

  if (templates.length === 0) return null;

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Supprimer ce modèle ?")) return;
    await deleteTemplate(id);
    if (applied === id) setApplied(null);
  }

  function handleApply(t: Template) {
    onApply(t);
    setApplied(t.id);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-medical-700 dark:text-medical-400 bg-medical-50 dark:bg-medical-950/30 border border-medical-200 dark:border-medical-800 rounded-lg hover:bg-medical-100 dark:hover:bg-medical-900/40 transition-all"
      >
        <BookTemplate className="w-4 h-4" />
        Appliquer un modèle
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Mes modèles</p>
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {templates.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => handleApply(t)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
                  >
                    {applied === t.id
                      ? <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <BookTemplate className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{t.name}</div>
                      <div className="text-xs text-zinc-400 truncate">{t.examType}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(t.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
