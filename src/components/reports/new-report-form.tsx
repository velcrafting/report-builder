"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { REPORTING_SECTIONS } from "@/config/sections";
import { createReportDraft } from "@/features/reports/actions";
import type { PeriodSummary } from "@/lib/db/periods";
import { PeriodPicker } from "@/components/ui/period-picker";

const CADENCE_OPTIONS = [
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
] as const;

type Cadence = (typeof CADENCE_OPTIONS)[number]["value"];

type NewReportFormProps = {
  periods: PeriodSummary[];
};

export function NewReportForm({ periods }: NewReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [section, setSection] = useState<string>(REPORTING_SECTIONS[0].value);
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !periodId) return;

    setError(null);
    startTransition(async () => {
      try {
        const draft = await createReportDraft({ section, periodId, title: title.trim() });
        router.push(`/admin/reports/${draft.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create report draft.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Department
          </span>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            disabled={isPending}
          >
            {REPORTING_SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Cadence
          </span>
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as Cadence)}
            className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            disabled={isPending}
          >
            {CADENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="block space-y-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Period
          </span>
          <PeriodPicker
            periods={periods}
            value={periodId}
            onChange={setPeriodId}
            disabled={isPending}
          />
        </div>

        <label className="block space-y-1">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q1 Academy Report"
            className="w-full rounded-[0.95rem] border border-white/15 bg-slate-950/65 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/45"
            disabled={isPending}
            required
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-rose-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !title.trim() || !periodId}
        className="inline-flex h-9 items-center rounded-full border border-[var(--accent)]/45 bg-[var(--accent)]/12 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "Creating…" : "Create Report"}
      </button>
    </form>
  );
}
