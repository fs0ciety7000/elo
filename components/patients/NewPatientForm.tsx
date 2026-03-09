"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPatientAccount } from "@/lib/actions/patients";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";

export function NewPatientForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      const result = await createPatientAccount(fd);
      if (result.success && result.data) {
        router.push(`/dashboard/patients/${result.data.id}`);
      } else {
        setError(result.message);
      }
    });
  }

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 transition-all";

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 sm:p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Prénom *</label>
            <input
              required
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              className={inputCls}
              placeholder="Marie"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Nom *</label>
            <input
              required
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              className={inputCls}
              placeholder="Dupont"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
            placeholder="marie.dupont@exemple.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Téléphone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputCls}
            placeholder="+32 470 00 00 00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Mot de passe temporaire *
          </label>
          <div className="relative">
            <input
              required
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={`${inputCls} pr-12`}
              placeholder="Min. 8 caractères"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Le patient pourra modifier ce mot de passe depuis son profil.
          </p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Création...</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Créer le patient</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
