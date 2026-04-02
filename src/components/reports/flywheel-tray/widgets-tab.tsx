// src/components/reports/flywheel-tray/widgets-tab.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { widgetDefinitions } from "@/features/widgets/registry";
import type { WidgetKind } from "@/features/widgets/types";

type WidgetsTabProps = {
  onAddBlank: (kind: WidgetKind) => void;
};

type DraggableWidgetKindProps = {
  kind: WidgetKind;
  label: string;
  layer: string;
};

function DraggableWidgetKind({ kind, label, layer }: DraggableWidgetKindProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `widget-kind-${kind}`,
    data: {
      type: "widget-kind",
      widgetKind: kind,
      displayLabel: label,
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
      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-white/35">{layer}</p>
      <p className="mt-0.5 text-sm font-medium text-white">{label}</p>
    </div>
  );
}

export function WidgetsTab({ onAddBlank }: WidgetsTabProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      {widgetDefinitions.map((def) => (
        <DraggableWidgetKind
          key={def.kind}
          kind={def.kind}
          label={def.label}
          layer={def.layer}
        />
      ))}
    </div>
  );
}
