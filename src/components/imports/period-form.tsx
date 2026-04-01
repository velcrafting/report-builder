"use client";

import { useState } from "react";
import type { PeriodSummary as Period } from "@/lib/db/periods";
import type { CreatePeriodData } from "@/features/imports/actions";

type PeriodFormProps = {
  periods: Period[];
  onSelect: (periodId: string) => void;
  onCreate: (data: CreatePeriodData) => void;
  loading: boolean;
};

export function PeriodForm({ periods, onSelect, onCreate, loading }: PeriodFormProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedId, setSelectedId] = useState<string>(periods[0]?.id ?? "");
  const [cadence, setCadence] = useState<CreatePeriodData["cadence"]>("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [label, setLabel] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "existing") {
      onSelect(selectedId);
    } else {
      onCreate({ cadence, startDate, endDate, label });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "existing"
              ? "bg-[var(--accent)] text-white"
              : "border border-white/10 text-slate-300 hover:border-white/30"
          }`}
        >
          Select existing period
        </button>
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "new"
              ? "bg-[var(--accent)] text-white"
              : "border border-white/10 text-slate-300 hover:border-white/30"
          }`}
        >
          Create new period
        </button>
      </div>

      {mode === "existing" ? (
        <div className="space-y-3">
          {periods.length === 0 ? (
            <p className="text-sm text-slate-400">No periods found. Create one below.</p>
          ) : (
            periods.map((period) => (
              <label
                key={period.id}
                className="flex cursor-pointer items-center gap-3 rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20"
              >
                <input
                  type="radio"
                  name="periodId"
                  value={period.id}
                  checked={selectedId === period.id}
                  onChange={() => setSelectedId(period.id)}
                  className="accent-[var(--accent)]"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{period.label}</p>
                  <p className="text-xs text-slate-400">
                    {period.cadence} ·{" "}
                    {new Date(period.startDate).toLocaleDateString()} –{" "}
                    {new Date(period.endDate).toLocaleDateString()}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
            <span>Label</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Q2 2026"
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Cadence</span>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as CreatePeriodData["cadence"])}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <div className="space-y-2 text-sm text-slate-300">
            {/* spacer for alignment */}
          </div>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>End date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
            />
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (mode === "existing" && !selectedId)}
        className="w-full rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
