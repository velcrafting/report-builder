"use client";

import { useState } from "react";
import type { PeriodSummary } from "@/lib/db/periods";
import { FadeIn } from "@/components/ui/fade-in";
import { SurfaceCard } from "@/components/ui/surface-card";
import { UploadStep } from "./upload-step";
import { PeriodForm } from "./period-form";
import { ColumnMapper } from "./column-mapper";
import {
  uploadCSV,
  saveImportBatch,
  saveFieldMappings,
  createNewPeriod,
  type UploadCSVResult,
  type MappingEntry,
  type CreatePeriodData,
} from "@/features/imports/actions";
import type { ColumnTypeSuggestion } from "@/lib/csv/parser";

type ImportWorkspaceProps = {
  periods: PeriodSummary[];
};

const STEP_LABELS = ["Upload", "Period", "Review columns", "Map fields"];

type UploadState = {
  headers: string[];
  totalRows: number;
  suggestions: ColumnTypeSuggestion[];
  rawRows: Record<string, string>[];
  filename: string;
  section: string;
  kind: "primary" | "supplemental";
};

export function ImportWorkspace({ periods: initialPeriods }: ImportWorkspaceProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [uploadedData, setUploadedData] = useState<UploadState | null>(null);
  const [periods, setPeriods] = useState<PeriodSummary[]>(initialPeriods);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [savedBatchId, setSavedBatchId] = useState<string | null>(null);

  // ------------------------------------------------------------------
  // Step 1: Parse CSV via server action
  // ------------------------------------------------------------------
  async function handleUpload(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const result: UploadCSVResult = await uploadCSV(formData);
      const filename = (formData.get("file") as File)?.name ?? "upload.csv";
      const section = (formData.get("section") as string) ?? "academy";
      const kind = (formData.get("kind") as "primary" | "supplemental") ?? "primary";
      setUploadedData({ ...result, filename, section, kind });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // Step 2: Period selection/creation, then save batch to DB
  // ------------------------------------------------------------------
  async function handlePeriodSelect(periodId: string) {
    if (!uploadedData) return;
    setError(null);
    setLoading(true);
    try {
      setSelectedPeriodId(periodId);
      const { batchId } = await saveImportBatch({
        section: uploadedData.section,
        periodId,
        filename: uploadedData.filename,
        kind: uploadedData.kind,
        rawRows: uploadedData.rawRows,
      });
      setSavedBatchId(batchId);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save batch");
    } finally {
      setLoading(false);
    }
  }

  async function handlePeriodCreate(data: CreatePeriodData) {
    setError(null);
    setLoading(true);
    try {
      const period = await createNewPeriod(data);
      setPeriods((prev) => [period, ...prev]);
      await handlePeriodSelect(period.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create period");
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // Step 3 → 4: advance from column review to mapping
  // ------------------------------------------------------------------
  function handleAdvanceToMapping() {
    setStep(4);
  }

  // ------------------------------------------------------------------
  // Step 4: Save field mappings
  // ------------------------------------------------------------------
  async function handleSaveMappings(mappings: MappingEntry[]) {
    if (!savedBatchId || !uploadedData) return;
    setError(null);
    setLoading(true);
    try {
      await saveFieldMappings({
        batchId: savedBatchId,
        section: uploadedData.section,
        mappings,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mappings");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (success) {
    return (
      <FadeIn>
        <SurfaceCard eyebrow="Import complete" title="All rows and mappings saved">
          <p className="text-sm text-slate-300">
            Batch <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{savedBatchId}</code> is
            marked as <strong className="text-white">mapped</strong>. Unmapped columns remain
            visible in the registry for future promotion.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setUploadedData(null);
              setSelectedPeriodId("");
              setSavedBatchId(null);
              setSuccess(false);
              setError(null);
            }}
            className="mt-4 rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-slate-300 transition hover:border-white/30"
          >
            Import another file
          </button>
        </SurfaceCard>
      </FadeIn>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, idx) => {
          const stepNum = (idx + 1) as 1 | 2 | 3 | 4;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={stepNum} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : isDone
                    ? "bg-[var(--accent)]/40 text-white/70"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`text-sm ${isActive ? "font-semibold text-white" : "text-slate-400"}`}
              >
                {label}
              </span>
              {idx < STEP_LABELS.length - 1 && (
                <div className="mx-1 h-px w-6 bg-white/10" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-[1.2rem] border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <FadeIn>
          <SurfaceCard eyebrow="Step 1" title="Upload CSV">
            <UploadStep onSubmit={handleUpload} loading={loading} />
          </SurfaceCard>
        </FadeIn>
      )}

      {/* Step 2: Period */}
      {step === 2 && (
        <FadeIn>
          <SurfaceCard eyebrow="Step 2" title="Assign reporting period">
            <p className="mb-4 text-sm text-slate-400">
              File: <span className="text-white">{uploadedData?.filename}</span> ·{" "}
              {uploadedData?.totalRows} rows detected
            </p>
            <PeriodForm
              periods={periods}
              onSelect={handlePeriodSelect}
              onCreate={handlePeriodCreate}
              loading={loading}
            />
          </SurfaceCard>
        </FadeIn>
      )}

      {/* Step 3: Column review */}
      {step === 3 && uploadedData && (
        <FadeIn>
          <SurfaceCard eyebrow="Step 3" title="Review detected columns">
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedData.headers.map((h) => {
                const suggestion = uploadedData.suggestions.find((s) => s.columnName === h);
                return (
                  <span
                    key={h}
                    className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-200"
                  >
                    {h}{" "}
                    {suggestion && (
                      <span className="opacity-50">· {suggestion.suggestedType}</span>
                    )}
                  </span>
                );
              })}
            </div>
            <p className="text-sm text-slate-400">
              {uploadedData.totalRows} rows · {uploadedData.headers.length} columns detected.
              Review looks right? Continue to assign field roles.
            </p>
            <button
              onClick={handleAdvanceToMapping}
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Continue to field mapping
            </button>
          </SurfaceCard>
        </FadeIn>
      )}

      {/* Step 4: Column mapping */}
      {step === 4 && uploadedData && (
        <FadeIn>
          <SurfaceCard eyebrow="Step 4" title="Assign field roles">
            <p className="mb-4 text-sm text-slate-400">
              Assign a role to each detected column. Columns marked{" "}
              <strong className="text-white">ignored</strong> are stored but excluded from widget
              eligibility.
            </p>
            <ColumnMapper
              suggestions={uploadedData.suggestions}
              onSave={handleSaveMappings}
              loading={loading}
            />
          </SurfaceCard>
        </FadeIn>
      )}
    </div>
  );
}
