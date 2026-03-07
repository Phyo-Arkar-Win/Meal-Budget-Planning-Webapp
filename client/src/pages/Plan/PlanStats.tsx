// client/src/pages/Progress/WeeklyProgress.tsx
// Drop-in redesign — same props/data shape, visual layer only updated.

import { useMemo } from "react";

// ─── Types (adjust to match your actual API response) ───────────────────────
interface DayEntry {
  day: number;          // 1-based
  calExceeded: number | null;
  exercised: boolean;
  saved: boolean;
}

interface ProgressProps {
  goal?: string;
  totalDays?: number;
  daysSaved?: number;
  compliance?: number;      // 0–100
  exercisedDays?: number;
  avgExceeded?: number | null;
  days?: DayEntry[];
}

// ─── Demo data (remove when wiring real API) ────────────────────────────────
const DEMO: Required<ProgressProps> = {
  goal: "Maintenance",
  totalDays: 5,
  daysSaved: 1,
  compliance: 100,
  exercisedDays: 0,
  avgExceeded: null,
  days: [
    { day: 1, calExceeded: 0,    exercised: false, saved: true  },
    { day: 2, calExceeded: null, exercised: false, saved: false },
    { day: 3, calExceeded: null, exercised: false, saved: false },
    { day: 4, calExceeded: null, exercised: false, saved: false },
    { day: 5, calExceeded: null, exercised: false, saved: false },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function barColor(entry: DayEntry) {
  if (!entry.saved)            return "#E5DDD0";   // not saved — muted warm
  if (entry.exercised)         return "#60A5FA";   // blue
  if ((entry.calExceeded ?? 0) > 0) return "#F87171"; // red
  return "#F59E0B";                                 // amber — within target
}

function StatusBadge({ saved, calExceeded }: { saved: boolean; calExceeded: number | null }) {
  if (!saved)
    return <span className="text-xs text-stone-300 font-sans">—</span>;
  if (calExceeded === null || calExceeded === 0)
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100 font-sans">
        saved
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-500 border border-red-100 font-sans">
      over
    </span>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-5 py-4 flex flex-col gap-1.5 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 font-sans">{label}</span>
      <span className={`text-2xl font-bold font-sans leading-none ${color}`}>{value}</span>
    </div>
  );
}

// ─── Bar chart ───────────────────────────────────────────────────────────────
function CalorieChart({ days, totalDays }: { days: DayEntry[]; totalDays: number }) {
  const maxVal = useMemo(
    () => Math.max(...days.map(d => Math.abs(d.calExceeded ?? 0)), 1),
    [days]
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 font-sans">Calories Exceeded Per Day</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {[
            { color: "bg-amber-400",  label: "Within target" },
            { color: "bg-red-400",    label: "Over target"   },
            { color: "bg-stone-200",  label: "Not saved"     },
            { color: "bg-blue-400",   label: "Exercised"     },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-stone-400 font-sans">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-3 h-32">
        {Array.from({ length: totalDays }, (_, i) => {
          const entry = days.find(d => d.day === i + 1) ?? { day: i + 1, calExceeded: null, exercised: false, saved: false };
          const pct = entry.saved ? Math.max(((Math.abs(entry.calExceeded ?? 0)) / maxVal) * 100, 8) : 8;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-lg transition-all duration-500"
                style={{ height: `${pct}%`, backgroundColor: barColor(entry), minHeight: "8px" }}
                title={entry.saved ? `Day ${entry.day}: ${entry.calExceeded ?? 0} kcal` : `Day ${entry.day}: not saved`}
              />
              <span className="text-[10px] text-stone-400 font-sans">{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const WeeklyProgress = (props: ProgressProps) => {
  const {
    goal, totalDays, daysSaved, compliance,
    exercisedDays, avgExceeded, days,
  } = { ...DEMO, ...props };

  const labelCls = "text-[10px] font-semibold uppercase tracking-widest text-stone-400 font-sans";

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#FDF8F0" }}>
      <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col gap-6">

        {/* ── Page header ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 font-sans mb-1">W</p>
          <h1
            className="text-stone-900 leading-tight mb-1"
            style={{ fontFamily: "'Georgia','Times New Roman',serif", fontSize: "2rem", fontWeight: 700 }}
          >
            Your Progress
          </h1>
          <p className="text-sm text-stone-400 font-sans">
            {goal} · {totalDays} Days
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Days Saved"
            value={`${daysSaved}/${totalDays}`}
            color="text-red-500"
          />
          <StatCard
            label="Compliance"
            value={`${compliance}%`}
            color="text-emerald-500"
          />
          <StatCard
            label="Exercised"
            value={`${exercisedDays} day${exercisedDays !== 1 ? "s" : ""}`}
            color="text-blue-500"
          />
          <StatCard
            label="Avg Exceeded"
            value={avgExceeded != null ? `${avgExceeded} kcal` : "None"}
            color="text-amber-500"
          />
        </div>

        {/* ── Chart ── */}
        <CalorieChart days={days} totalDays={totalDays} />

        {/* ── Day-by-day table ── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <p className={labelCls}>Day-by-Day Breakdown</p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-4 px-6 py-2.5 bg-[#FAF6EF]">
            {["Day", "Cal Exceeded", "Exercise", "Status"].map(h => (
              <span key={h} className={labelCls}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {days.map((entry, i) => (
            <div
              key={entry.day}
              className={`grid grid-cols-4 items-center px-6 py-3.5 font-sans text-sm ${
                i < days.length - 1 ? "border-b border-stone-50" : ""
              }`}
            >
              {/* Day */}
              <span className="font-semibold text-stone-800">Day {entry.day}</span>

              {/* Cal exceeded */}
              <span>
                {!entry.saved ? (
                  <span className="text-stone-300">—</span>
                ) : entry.calExceeded === 0 ? (
                  <span className="text-emerald-500 font-medium">On target</span>
                ) : entry.calExceeded != null ? (
                  <span className="text-red-500 font-medium">+{entry.calExceeded} kcal</span>
                ) : (
                  <span className="text-stone-300">—</span>
                )}
              </span>

              {/* Exercise */}
              <span>
                {entry.exercised
                  ? <span className="text-blue-500 font-medium">✓</span>
                  : <span className="text-stone-300">—</span>}
              </span>

              {/* Status badge */}
              <StatusBadge saved={entry.saved} calExceeded={entry.calExceeded} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default WeeklyProgress;
