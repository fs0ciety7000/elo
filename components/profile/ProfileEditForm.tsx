"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/auth";
import { Pencil, Save, Loader2, CheckCircle, X } from "lucide-react";

interface Props {
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    speciality: string;
    inami: string;
  };
  isDoctor: boolean;
}

export function ProfileEditForm({ user, isDoctor }: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone);
  const [speciality, setSpeciality] = useState(user.speciality);
  const [inami, setInami] = useState(user.inami);

  function handleCancel() {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
    setSpeciality(user.speciality);
    setInami(user.inami);
    setMessage(null);
    setIsEditing(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("phone", phone);
      if (isDoctor) {
        formData.append("speciality", speciality);
        formData.append("inami", inami);
      }
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        setIsEditing(false);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Pencil className="w-4 h-4 text-medical-600" />
          Modifier mes informations
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-medical-600 hover:text-medical-700 font-medium"
          >
            Modifier
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <X className="w-4 h-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Prénom</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Nom</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Téléphone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={!isEditing}
            placeholder="+32 470 00 00 00"
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          />
        </div>

        {isDoctor && (
          <>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Spécialité</label>
              <input
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Numéro INAMI</label>
              <input
                value={inami}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setInami(v);
                }}
                disabled={!isEditing}
                placeholder="12345678"
                maxLength={8}
                pattern="\d{8}"
                title="8 chiffres (ex: 19207879)"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              />
              {isEditing && inami.length > 0 && inami.length < 8 && (
                <p className="text-xs text-amber-500 mt-1">{inami.length}/8 chiffres requis</p>
              )}
            </div>
          </>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-medical-600 hover:bg-medical-700 disabled:bg-medical-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde...</>
              ) : (
                <><Save className="w-4 h-4" /> Enregistrer</>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
