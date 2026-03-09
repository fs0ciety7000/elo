"use client";

import { useState, useTransition } from "react";
import { assignPatientToDoctor, unassignPatientFromDoctor } from "@/lib/actions/patients";
import { UserPlus, Loader2, X } from "lucide-react";
import { Role } from "@prisma/client";

interface Props {
  patientId: string;
  currentDoctorIds: string[];
  sessionRole: Role;
  sessionDoctorId: string;
  allDoctors: { id: string; firstName: string; lastName: string; speciality?: string | null }[];
}

export function AssignDoctorForm({
  patientId,
  currentDoctorIds,
  sessionRole,
  sessionDoctorId,
  allDoctors,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = sessionRole === Role.ADMIN;
  const alreadyAssigned = currentDoctorIds.includes(sessionDoctorId);

  function handleAssign() {
    const doctorId = isAdmin ? selectedDoctorId : sessionDoctorId;
    if (!doctorId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await assignPatientToDoctor(patientId, doctorId);
      setMessage(result.message);
      if (result.success && isAdmin) setSelectedDoctorId("");
    });
  }

  function handleUnassign(doctorId: string) {
    startTransition(async () => {
      await unassignPatientFromDoctor(patientId, doctorId);
    });
  }

  if (!isAdmin && alreadyAssigned) {
    return (
      <div className="flex items-center justify-between text-xs text-green-700 bg-green-50 p-2.5 rounded-lg">
        <span>Vous êtes assigné à ce patient</span>
        <button
          onClick={() => handleUnassign(sessionDoctorId)}
          disabled={isPending}
          className="text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <X className="w-3 h-3" /> Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {message && (
        <p className="text-xs text-green-700">{message}</p>
      )}

      {isAdmin ? (
        <div className="flex gap-2">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs outline-none focus:ring-2 focus:ring-medical-500"
          >
            <option value="">Choisir un médecin...</option>
            {allDoctors
              .filter((d) => !currentDoctorIds.includes(d.id))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.lastName} {d.firstName}{d.speciality ? ` (${d.speciality})` : ""}
                </option>
              ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedDoctorId || isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-medical-600 text-white rounded-lg text-xs font-medium hover:bg-medical-700 disabled:bg-medical-400 transition-all"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
            Assigner
          </button>
        </div>
      ) : (
        <button
          onClick={handleAssign}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-medical-200 text-medical-600 rounded-lg text-xs font-medium hover:bg-medical-50 transition-all"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
          M&apos;assigner ce patient
        </button>
      )}
    </div>
  );
}
