"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { SECTION_OPTIONS } from "@/config/sections";

type UploadStepProps = {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
};

export function UploadStep({ onSubmit, loading }: UploadStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* File drop zone */}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/20 bg-white/4 px-6 py-10 text-center transition hover:border-[var(--accent)] hover:bg-white/7">
        <UploadCloud className="h-8 w-8 text-[var(--accent)]" />
        <span className="mt-4 text-base font-semibold text-white">
          Drop a CSV or browse files
        </span>
        <span className="mt-2 text-sm text-slate-300">
          The file is parsed server-side. Raw rows are stored exactly as uploaded.
        </span>
        <input
          ref={fileRef}
          className="sr-only"
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Section selector */}
        <label className="space-y-2 text-sm text-slate-300">
          <span>Section</span>
          <select
            name="section"
            defaultValue={SECTION_OPTIONS[0]?.value ?? "academy"}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
          >
            {SECTION_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {/* Kind selector */}
        <label className="space-y-2 text-sm text-slate-300">
          <span>Import kind</span>
          <select
            name="kind"
            defaultValue="primary"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
          >
            <option value="primary">Primary</option>
            <option value="supplemental">Supplemental</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Parsing…" : "Parse CSV"}
      </button>
    </form>
  );
}
