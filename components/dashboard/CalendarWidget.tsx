"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface ExamEvent {
  id: string;
  date: Date;
  examType: string;
  patientName?: string;
}

interface Props {
  scheduledDates: ExamEvent[];
}

const MONTH_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const DAY_FR = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

export function CalendarWidget({ scheduledDates }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [popup, setPopup] = useState<{ day: number; events: ExamEvent[] } | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  // Map: day → events
  const eventMap = new Map<number, ExamEvent[]>();
  for (const e of scheduledDates) {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventMap.has(day)) eventMap.set(day, []);
      eventMap.get(day)!.push(e);
    }
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isThisMonth = year === now.getFullYear() && month === now.getMonth();
  const todayDay    = now.getDate();

  function handleDayClick(day: number) {
    const events = eventMap.get(day);
    if (events && events.length > 0) setPopup({ day, events });
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm dark:shadow-zinc-900/50 p-5 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500" />
        </button>

        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
          {MONTH_FR[month]} {year}
        </h2>

        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_FR.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isToday   = isThisMonth && day === todayDay;
          const hasEvents = eventMap.has(day);
          const count     = eventMap.get(day)?.length ?? 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(day)}
              title={hasEvents ? `${count} examen${count > 1 ? "s" : ""}` : undefined}
              className={`relative flex items-center justify-center h-8 rounded-lg text-xs font-medium transition-all
                ${isToday ? "bg-medical-600 text-white" : ""}
                ${hasEvents && !isToday ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/60" : ""}
                ${!isToday && !hasEvents ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-default" : ""}
              `}
            >
              {day}
              {hasEvents && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="w-3 h-3 rounded-full bg-medical-600" />
          {"Aujourd'hui"}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-900 border border-blue-300" />
          Examen planifié
        </div>
      </div>

      {/* Popup événement */}
      {popup && (
        <div className="absolute inset-x-0 bottom-full mb-2 z-50 mx-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                {popup.day} {MONTH_FR[month]} {year}
              </span>
              <button
                onClick={() => setPopup(null)}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>
            <div className="space-y-2">
              {popup.events.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/dashboard/prescriptions/${ev.id}`}
                  onClick={() => setPopup(null)}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ev.examType}</div>
                    {ev.patientName && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{ev.patientName}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
