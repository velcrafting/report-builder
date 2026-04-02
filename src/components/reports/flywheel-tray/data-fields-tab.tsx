// src/components/reports/flywheel-tray/data-fields-tab.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FieldSuggestion } from "@/features/imports/field-suggestions-action";
import type { WidgetKind } from "@/features/widgets/types";

type DataFieldsTabProps = {
  fields: FieldSuggestion[];
  section: string;
};

type DraggableFieldProps = {
  field: FieldSuggestion;
};

function DraggableField({ field }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: {
      type: "field",
      fieldId: field.id,
      widgetKind: field.suggestedWidgetKind as WidgetKind,
      displayLabel: field.displayLabel,
      fieldRole: field.fieldRole,
      internalKey: field.internalKey,
    },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-[0.85rem] border border-white/10 bg-slate-950/60 px-3 py-2.5 active:cursor-grabbing"
    >
      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-white/35">
        {field.fieldRole} · {field.fieldType}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white">{field.displayLabel}</p>
      <p className="mt-1 text-[0.68rem] text-[var(--accent)]">
        → {field.suggestedWidgetLabel}
      </p>
    </div>
  );
}

export function DataFieldsTab({ fields, section }: DataFieldsTabProps) {
  if (fields.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <p className="text-sm text-white/40">No mapped fields yet</p>
        <p className="text-xs text-white/25">
          Import a CSV for <span className="text-white/40">{section}</span> and map field
          roles to see suggestions here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {fields.map((field) => (
        <DraggableField key={field.id} field={field} />
      ))}
    </div>
  );
}
