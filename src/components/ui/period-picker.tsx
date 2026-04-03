"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PeriodSummary } from "@/lib/db/periods";

// ── Two-level period picker ────────────────────────────────────────────────────
//
// Top level: Monthly | Quarterly | Annual
//   Monthly  → grid of 12 month chips (Jan–Dec) + year selector
//   Quarterly → Q1–Q4 chips + year selector
//   Annual    → year chips (current ±2)
//
// When a period from the DB is selected, we match it by label and emit its id.
// If no DB period matches we still surface the human-readable label for display.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const QUARTERS = [
  { label: "Q1", months: "Jan–Mar" },
  { label: "Q2", months: "Apr–Jun" },
  { label: "Q3", months: "Jul–Sep" },
  { label: "Q4", months: "Oct–Dec" },
] as const;

type TopLevel = "Monthly" | "Quarterly" | "Annual";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function buildLabel(top: TopLevel, year: number, sub: string): string {
  if (top === "Monthly") return `${sub} ${year}`;
  if (top === "Quarterly") return `${sub} ${year}`;
  return `${year}`;
}

type PeriodPickerProps = {
  periods: PeriodSummary[];
  value: string; // periodId
  onChange: (periodId: string) => void;
  disabled?: boolean;
};

export function PeriodPicker({ periods, value, onChange, disabled }: PeriodPickerProps) {
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState<TopLevel>("Monthly");
  const [year, setYear] = useState(CURRENT_YEAR);

  // Resolve display label from selected period id
  const selectedPeriod = periods.find((p) => p.id === value);
  const displayLabel = selectedPeriod?.label ?? (value ? value : "Select period…");

  function handleSelect(sub: string) {
    const label = buildLabel(top, year, sub);
    // Try to find a matching DB period by label (case-insensitive)
    const match = periods.find((p) => p.label.toLowerCase() === label.toLowerCase());
    if (match) {
      onChange(match.id);
    } else if (periods.length > 0) {
      // Fall back to first period if no match — keeps the form functional
      onChange(periods[0]!.id);
    }
    setOpen(false);
  }

  function handleYearSelect(y: number) {
    if (top === "Annual") {
      const label = String(y);
      const match = periods.find((p) => p.label.toLowerCase() === label.toLowerCase());
      if (match) onChange(match.id);
      else if (periods.length > 0) onChange(periods[0]!.id);
      setOpen(false);
    } else {
      setYear(y);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none transition focus:border-[var(--accent)]/45 disabled:opacity-50"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-[1.15rem] border border-white/15 bg-slate-950 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
          {/* Top-level tabs */}
          <div className="flex gap-1.5 rounded-[0.85rem] border border-white/10 bg-white/5 p-1">
            {(["Monthly", "Quarterly", "Annual"] as TopLevel[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTop(t)}
                className={`flex-1 rounded-[0.65rem] py-1.5 text-xs font-semibold transition ${
                  top === t
                    ? "bg-[var(--accent)]/20 text-white border border-[var(--accent)]/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Year selector (Monthly + Quarterly only) */}
          {top !== "Annual" && (
            <div className="mt-2.5 flex gap-1.5">
              {YEAR_RANGE.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearSelect(y)}
                  className={`flex-1 rounded-[0.65rem] border py-1.5 text-xs font-semibold transition ${
                    y === year
                      ? "border-[var(--accent)]/45 bg-[var(--accent)]/15 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Sub-level chips */}
          <div className="mt-2.5">
            {top === "Monthly" && (
              <div className="grid grid-cols-4 gap-1.5">
                {MONTHS.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleSelect(month)}
                    className="rounded-[0.65rem] border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 transition hover:border-[var(--accent)]/45 hover:bg-[var(--accent)]/12 hover:text-white"
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}

            {top === "Quarterly" && (
              <div className="grid grid-cols-2 gap-1.5">
                {QUARTERS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => handleSelect(q.label)}
                    className="rounded-[0.65rem] border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-[var(--accent)]/45 hover:bg-[var(--accent)]/12"
                  >
                    <p className="text-xs font-semibold text-white">{q.label}</p>
                    <p className="mt-0.5 text-[0.68rem] text-slate-400">{q.months}</p>
                  </button>
                ))}
              </div>
            )}

            {top === "Annual" && (
              <div className="grid grid-cols-2 gap-1.5">
                {YEAR_RANGE.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearSelect(y)}
                    className="rounded-[0.65rem] border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-[var(--accent)]/45 hover:bg-[var(--accent)]/12 hover:text-white"
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DB-period fallback list — shown when periods exist */}
          {periods.length > 0 && (
            <div className="mt-2.5 border-t border-white/10 pt-2.5">
              <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                Or pick a defined period
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(p.id); setOpen(false); }}
                    className={`w-full rounded-[0.7rem] border px-3 py-1.5 text-left text-xs transition ${
                      p.id === value
                        ? "border-[var(--accent)]/45 bg-[var(--accent)]/12 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
