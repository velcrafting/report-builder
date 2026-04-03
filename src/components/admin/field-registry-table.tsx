"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { FieldRole, FieldType } from "@prisma/client";
import type { FieldRegistryEntryRow } from "@/lib/db/fieldRegistry";
import {
  getRegistryForSection,
  updateRegistryEntry,
  deactivateEntry,
} from "@/features/imports/registry-actions";
import {
  createDepartmentAction,
} from "@/features/settings/department-actions";

type Props = {
  sections: string[];
  sectionLabels?: Record<string, string>;
  initialSection?: string;
};

const FIELD_ROLE_OPTIONS: FieldRole[] = [
  "kpi",
  "evidence",
  "takeaway",
  "highlightFlag",
  "classification",
  "dimension",
  "metric",
  "note",
  "ignored",
];

export function FieldRegistryTable({ sections, sectionLabels = {}, initialSection }: Props) {
  const [allSections, setAllSections] = useState(sections);
  const [activeSection, setActiveSection] = useState(
    initialSection ?? sections[0] ?? ""
  );
  const [entries, setEntries] = useState<FieldRegistryEntryRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Add department state
  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [addDeptError, setAddDeptError] = useState<string | null>(null);
  const [allLabels, setAllLabels] = useState<Record<string, string>>(sectionLabels);

  function loadSection(section: string) {
    setActiveSection(section);
    setLoaded(false);
    startTransition(async () => {
      const data = await getRegistryForSection(section);
      setEntries(data);
      setLoaded(true);
    });
  }

  // Load initial section after mount
  useEffect(() => {
    if (activeSection) loadSection(activeSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    setAddDeptError(null);
    const name = newDeptName.trim();
    if (!name) { setAddDeptError("Name is required."); return; }
    startTransition(async () => {
      const result = await createDepartmentAction(name);
      if (result.error) { setAddDeptError(result.error); return; }
      if (result.department) {
        const { value, label } = result.department;
        setAllSections((prev) => [...prev, value]);
        setAllLabels((prev) => ({ ...prev, [value]: label }));
        setNewDeptName("");
        setShowAddDept(false);
        loadSection(value);
      }
    });
  }

  function handleDisplayLabelChange(id: string, displayLabel: string) {
    startTransition(async () => {
      const updated = await updateRegistryEntry(id, { displayLabel });
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, displayLabel: updated.displayLabel } : e))
      );
    });
  }

  function handleFieldRoleChange(id: string, fieldRole: FieldRole) {
    startTransition(async () => {
      const updated = await updateRegistryEntry(id, { fieldRole });
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, fieldRole: updated.fieldRole } : e))
      );
    });
  }

  function handleWidgetEligibleChange(id: string, widgetEligible: boolean) {
    startTransition(async () => {
      const updated = await updateRegistryEntry(id, { widgetEligible });
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, widgetEligible: updated.widgetEligible } : e
        )
      );
    });
  }

  function handleDeactivate(id: string) {
    startTransition(async () => {
      await deactivateEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      {/* Department Selector + Add */}
      <div className="flex flex-wrap items-center gap-2">
        {allSections.map((section) => (
          <button
            key={section}
            onClick={() => loadSection(section)}
            disabled={isPending}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeSection === section
                ? "bg-[var(--accent)] text-slate-950"
                : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
            } disabled:opacity-50`}
          >
            {allLabels[section] ?? section}
          </button>
        ))}

        {/* Add department button */}
        {!showAddDept ? (
          <button
            type="button"
            onClick={() => { setShowAddDept(true); setAddDeptError(null); }}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-white/20 bg-transparent px-3 py-1.5 text-sm text-white/50 transition hover:border-white/40 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add department
          </button>
        ) : (
          <form onSubmit={handleAddDepartment} className="flex items-center gap-2">
            <input
              autoFocus
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Department name"
              className="rounded-full border border-[var(--accent)]/45 bg-slate-950/65 px-3 py-1.5 text-sm text-white outline-none placeholder-white/30 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddDept(false); setNewDeptName(""); setAddDeptError(null); }}
              className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/50 transition hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {addDeptError && <p className="text-xs text-red-400">{addDeptError}</p>}
          </form>
        )}
      </div>

      {/* Loading state */}
      {isPending && (
        <p className="text-sm text-white/50">Loading…</p>
      )}

      {/* Empty state */}
      {!isPending && loaded && entries.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-white/50">
          No field registry entries for this section yet. Upload a CSV to add entries.
        </div>
      )}

      {/* Table */}
      {!isPending && loaded && entries.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
                <th className="px-4 py-3">Source Column</th>
                <th className="px-4 py-3">Display Label</th>
                <th className="px-4 py-3">Field Type</th>
                <th className="px-4 py-3">Field Role</th>
                <th className="px-4 py-3">Widget Eligible</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-white/5 hover:bg-white/3 transition"
                >
                  <td className="px-4 py-3 font-mono text-xs text-white/60">
                    {entry.sourceColumnName}
                  </td>
                  <td className="px-4 py-3">
                    <EditableLabel
                      value={entry.displayLabel}
                      onCommit={(val) => handleDisplayLabelChange(entry.id, val)}
                    />
                  </td>
                  <td className="px-4 py-3 text-white/60">{entry.fieldType}</td>
                  <td className="px-4 py-3">
                    <select
                      value={entry.fieldRole}
                      onChange={(e) =>
                        handleFieldRoleChange(entry.id, e.target.value as FieldRole)
                      }
                      disabled={isPending}
                      className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
                    >
                      {FIELD_ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={entry.widgetEligible}
                      onChange={(e) =>
                        handleWidgetEligibleChange(entry.id, e.target.checked)
                      }
                      disabled={isPending}
                      className="h-4 w-4 cursor-pointer accent-[var(--accent)] disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {entry.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeactivate(entry.id)}
                      disabled={isPending || !entry.active}
                      className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Deactivate
                    </button>
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

// ── Inline Editable Label ────────────────────────────────────────────────────

function EditableLabel({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== value) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (draft !== value) onCommit(draft);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full rounded-md border border-[var(--accent)] bg-slate-900 px-2 py-1 text-sm text-white focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-left text-white hover:underline"
    >
      {value}
    </button>
  );
}
