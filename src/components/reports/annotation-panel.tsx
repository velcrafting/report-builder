"use client";

import { useEffect, useState, useTransition } from "react";
import { InsightClassification, InsightPriority } from "@prisma/client";
import type { InsightAnnotationSummary } from "@/lib/db/annotations";
import {
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationsForSection,
  toggleRollupPromotion,
} from "@/features/reports/annotation-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnnotationPanelProps = {
  section: string;
  periodId: string;
  draftId?: string;
};

// ── Badge helpers ─────────────────────────────────────────────────────────────

const CLASSIFICATION_STYLES: Record<string, string> = {
  highlight: "bg-emerald-950 text-emerald-300 border border-emerald-800",
  risk: "bg-yellow-950 text-yellow-300 border border-yellow-800",
  blocker: "bg-red-950 text-red-300 border border-red-800",
  action: "bg-blue-950 text-blue-300 border border-blue-800",
  none: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-zinc-400",
};

function ClassificationBadge({ value }: { value: string | null }) {
  const key = (value ?? "none").toLowerCase();
  const cls = CLASSIFICATION_STYLES[key] ?? CLASSIFICATION_STYLES.none;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {key}
    </span>
  );
}

function PriorityBadge({ value }: { value: string | null }) {
  const key = (value ?? "low").toLowerCase();
  const cls = PRIORITY_STYLES[key] ?? PRIORITY_STYLES.low;
  return (
    <span className={`text-xs font-medium uppercase tracking-wide ${cls}`}>
      {key}
    </span>
  );
}

// ── Add form ──────────────────────────────────────────────────────────────────

type AddFormProps = {
  section: string;
  periodId: string;
  onCreated: (annotation: InsightAnnotationSummary) => void;
  onCancel: () => void;
};

function AddAnnotationForm({ section, periodId, onCreated, onCancel }: AddFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [classification, setClassification] = useState<string>(InsightClassification.none);
  const [priority, setPriority] = useState<string>(InsightPriority.low);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const annotation = await createAnnotation({
          section,
          periodId,
          title: title.trim(),
          body: body.trim(),
          classification,
          priority,
        });
        onCreated(annotation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create annotation.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          placeholder="Annotation title"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
          placeholder="Optional details…"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Classification</label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value={InsightClassification.highlight}>Highlight</option>
            <option value={InsightClassification.risk}>Risk</option>
            <option value={InsightClassification.blocker}>Blocker</option>
            <option value={InsightClassification.action}>Action</option>
            <option value={InsightClassification.none}>None</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value={InsightPriority.low}>Low</option>
            <option value={InsightPriority.medium}>Medium</option>
            <option value={InsightPriority.high}>High</option>
          </select>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="px-3 py-1.5 rounded-md text-sm bg-zinc-700 text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add annotation"}
        </button>
      </div>
    </form>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

type EditFormProps = {
  annotation: InsightAnnotationSummary;
  onUpdated: (annotation: InsightAnnotationSummary) => void;
  onCancel: () => void;
};

function EditAnnotationForm({ annotation, onUpdated, onCancel }: EditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(annotation.title);
  const [body, setBody] = useState(annotation.body ?? "");
  const [classification, setClassification] = useState<string>(
    annotation.classification ?? InsightClassification.none
  );
  const [priority, setPriority] = useState<string>(
    annotation.priority ?? InsightPriority.low
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const updated = await updateAnnotation(annotation.id, {
          title: title.trim(),
          body: body.trim(),
          classification,
          priority,
        });
        onUpdated(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update annotation.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-zinc-600 bg-zinc-900 p-3 mt-2">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500 resize-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Classification</label>
          <select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value={InsightClassification.highlight}>Highlight</option>
            <option value={InsightClassification.risk}>Risk</option>
            <option value={InsightClassification.blocker}>Blocker</option>
            <option value={InsightClassification.action}>Action</option>
            <option value={InsightClassification.none}>None</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-400 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value={InsightPriority.low}>Low</option>
            <option value={InsightPriority.medium}>Medium</option>
            <option value={InsightPriority.high}>High</option>
          </select>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-3 py-1.5 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !title.trim()}
          className="px-3 py-1.5 rounded-md text-sm bg-zinc-700 text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ── Annotation item ───────────────────────────────────────────────────────────

type AnnotationItemProps = {
  annotation: InsightAnnotationSummary;
  onUpdated: (annotation: InsightAnnotationSummary) => void;
  onDeleted: (id: string) => void;
};

function AnnotationItem({ annotation, onUpdated, onDeleted }: AnnotationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBodyExpanded, setIsBodyExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const bodyIsLong = (annotation.body ?? "").length > 120;
  const displayBody =
    bodyIsLong && !isBodyExpanded
      ? (annotation.body ?? "").slice(0, 120) + "…"
      : (annotation.body ?? "");

  function handleRollupToggle() {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await toggleRollupPromotion(annotation.id, !annotation.promotedToRollup);
        onUpdated(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update roll-up status.");
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Delete annotation "${annotation.title}"?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAnnotation(annotation.id);
        onDeleted(annotation.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete annotation.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-zinc-100">{annotation.title}</span>
          <ClassificationBadge value={annotation.classification} />
          <PriorityBadge value={annotation.priority} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            disabled={isPending}
            className="px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-2 py-1 rounded text-xs text-red-500 hover:text-red-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {displayBody && (
        <div>
          <p className="text-xs text-zinc-400 leading-relaxed">{displayBody}</p>
          {bodyIsLong && (
            <button
              type="button"
              onClick={() => setIsBodyExpanded((v) => !v)}
              className="text-xs text-zinc-500 hover:text-zinc-300 mt-0.5"
            >
              {isBodyExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          role="switch"
          aria-checked={annotation.promotedToRollup}
          onClick={handleRollupToggle}
          disabled={isPending}
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors disabled:opacity-50 ${
            annotation.promotedToRollup ? "bg-emerald-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${
              annotation.promotedToRollup ? "translate-x-3.5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className="text-xs text-zinc-500">
          {annotation.promotedToRollup ? "Included in roll-up" : "Include in roll-up"}
        </span>
        {isPending && (
          <span className="text-xs text-zinc-600 italic">Saving…</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {isEditing && (
        <EditAnnotationForm
          annotation={annotation}
          onUpdated={(updated) => {
            onUpdated(updated);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function AnnotationPanel({ section, periodId }: AnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<InsightAnnotationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    getAnnotationsForSection(section, periodId)
      .then((data) => {
        if (!cancelled) setAnnotations(data);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load annotations.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [section, periodId]);

  function handleCreated(annotation: InsightAnnotationSummary) {
    setAnnotations((prev) => [annotation, ...prev]);
    setIsAdding(false);
  }

  function handleUpdated(annotation: InsightAnnotationSummary) {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotation.id ? annotation : a))
    );
  }

  function handleDeleted(id: string) {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Annotations</h3>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-md text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border border-zinc-700"
          >
            + Add annotation
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <AddAnnotationForm
          section={section}
          periodId={periodId}
          onCreated={handleCreated}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <p className="text-xs text-zinc-500 italic">Loading annotations…</p>
      )}

      {/* Load error */}
      {loadError && !isLoading && (
        <p className="text-xs text-red-400">{loadError}</p>
      )}

      {/* Empty state */}
      {!isLoading && !loadError && annotations.length === 0 && (
        <p className="text-xs text-zinc-500 italic">
          No annotations yet. Add your first insight.
        </p>
      )}

      {/* Annotation list */}
      {!isLoading && annotations.length > 0 && (
        <div className="space-y-2">
          {annotations.map((annotation) => (
            <AnnotationItem
              key={annotation.id}
              annotation={annotation}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
