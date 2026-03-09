"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  pending: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

interface ExamTypeData {
  name: string;
  count: number;
}

interface Props {
  monthly: MonthlyData[];
  examTypes: ExamTypeData[];
}

const STATUS_COLORS = {
  pending: "#f59e0b",
  scheduled: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

const EXAM_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#6366f1", "#ec4899"];

const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
};

export function AnalyticsCharts({ monthly, examTypes }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
      {/* Bar chart : Prescriptions par mois */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
        <h2 className="font-semibold text-zinc-900 text-sm mb-4">
          Activité des 6 derniers mois
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} barSize={8} barGap={2}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f4f4f5" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(v: string) =>
                ({ pending: "En attente", scheduled: "Planifié", completed: "Terminé", cancelled: "Annulé" }[v] ?? v)
              }
            />
            <Bar dataKey="pending" fill={STATUS_COLORS.pending} radius={[4, 4, 0, 0]} />
            <Bar dataKey="scheduled" fill={STATUS_COLORS.scheduled} radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill={STATUS_COLORS.completed} radius={[4, 4, 0, 0]} />
            <Bar dataKey="cancelled" fill={STATUS_COLORS.cancelled} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart : Répartition par type d'examen */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-5">
        <h2 className="font-semibold text-zinc-900 text-sm mb-4">
          Répartition par type d&apos;examen
        </h2>
        {examTypes.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-zinc-400">
            Aucune donnée
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={examTypes}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {examTypes.map((_, i) => (
                  <Cell key={i} fill={EXAM_COLORS[i % EXAM_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
