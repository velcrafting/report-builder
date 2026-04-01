"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRollupAction } from "@/features/rollup/rollup-actions";

type AvailableOutput = {
  id: string;
  section: string;
  sectionLabel: string;
  versionNumber: number;
  approvedAt: Date | null;
};

type RollupComposerProps = {
  periodId: string;
  periodLabel: string;
  availableOutputs: AvailableOutput[];
};

export function RollupComposer({
  periodId,
  periodLabel,
  availableOutputs,
}: RollupComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(`${periodLabel} Roll-up`);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function toggleOutput(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedIds.size === 0) {
      setError("Select at least one approved output to include in the roll-up.");
      return;
    }

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    startTransition(async () => {
      try {
        await createRollupAction({
          periodId,
          title: title.trim(),
          sourceOutputIds: Array.from(selectedIds),
        });
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create roll-up."
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <label
          htmlFor="rollup-title"
          className="block text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45"
        >
          Title
        </label>
        <input
          id="rollup-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          placeholder="e.g. Q1 2025 Roll-up"
        />
      </div>

      {/* Output selection */}
      <div className="space-y-1.5">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45">
          Approved outputs
        </p>

        {availableOutputs.length === 0 ? (
          <p className="rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
            No approved outputs available for this period.
          </p>
        ) : (
          <div className="space-y-2">
            {availableOutputs.map((output) => {
              const checked = selectedIds.has(output.id);
              return (
                <label
                  key={output.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-[1.1rem] border px-4 py-3 text-sm transition ${
                    checked
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOutput(output.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[var(--accent)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">
                      {output.sectionLabel}{" "}
                      <span className="font-normal text-white/50">
                        v{output.versionNumber}
                      </span>
                    </p>
                    {output.approvedAt && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        Approved{" "}
                        {new Date(output.approvedAt).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="rounded-[1.1rem] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || availableOutputs.length === 0}
        className="rounded-[1.1rem] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Composing…" : "Compose Roll-up"}
      </button>
    </form>
  );
}
