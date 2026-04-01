"use client";

import { useState, useTransition } from "react";
import type { PeriodSummary } from "@/lib/db/periods";
import type { Cadence } from "@prisma/client";
import { createPeriodAction } from "@/features/periods/period-actions";
import { CADENCE_OPTIONS } from "@/config/sections";

type Props = {
  initialPeriods: PeriodSummary[];
};

export function PeriodManager({ initialPeriods }: Props) {
  const [periods, setPeriods] = useState<PeriodSummary[]>(initialPeriods);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [label, setLabel] = useState("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function resetForm() {
    setLabel("");
    setCadence("monthly");
    setStartDate("");
    setEndDate("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !startDate || !endDate) return;

    startTransition(async () => {
      const created = await createPeriodAction({
        label,
        cadence,
        startDate,
        endDate,
      });
      setPeriods((prev) => [created, ...prev]);
      resetForm();
      setShowForm(false);
    });
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">
          {periods.length} period{periods.length !== 1 ? "s" : ""} defined
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
        >
          {showForm ? "Cancel" : "New Period"}
        </button>
      </div>

      {/* New Period Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">Create New Period</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Q1 2025"
                required
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Cadence</label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as Cadence)}
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {CADENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Period"}
            </button>
          </div>
        </form>
      )}

      {/* Periods Table */}
      {periods.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-white/50">
          No periods defined yet. Create your first period above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Cadence</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Comparison Period</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr
                  key={period.id}
                  className="border-b border-white/5 hover:bg-white/3 transition"
                >
                  <td className="px-4 py-3 font-medium">{period.label}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs capitalize">
                      {period.cadence}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {formatDate(period.startDate)}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {formatDate(period.endDate)}
                  </td>
                  <td className="px-4 py-3 text-white/40">
                    {period.comparisonPeriodId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
