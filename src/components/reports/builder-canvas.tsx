// src/components/reports/builder-canvas.tsx
"use client";

import { Grip } from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { ReportBuilderSnapshot } from "@/features/reports/types";

// ── Between-zone drop target ─────────────────────────────────────────────────

type BetweenZoneDropProps = {
  id: string;
  isOver: boolean;
};

function BetweenZoneDrop({ id, isOver }: BetweenZoneDropProps) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`mx-2 my-1 h-6 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? "border-[var(--accent)]/60 bg-[var(--accent)]/5" : "border-white/5"
      }`}
    />
  );
}

// ── Sortable card ─────────────────────────────────────────────────────────────

type SortableCardProps = {
  card: ReportBuilderSnapshot["zones"][number]["cards"][number];
  isSelected: boolean;
  onSelect: (id: string) => void;
};

function SortableCard({ card, isSelected, onSelect }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        onClick={() => onSelect(card.id)}
        className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition ${
          isSelected
            ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(242,141,73,0.14)]"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-xl border border-white/10 bg-slate-950/45 p-2.5 active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <Grip className="h-4 w-4 text-white/50" />
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                {card.widgetType}
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{card.source}</p>
              {card.value ? (
                <p className="mt-2 text-sm leading-6 text-slate-200">{card.value}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 text-right">
            <p className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
              {card.size}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
              {card.status}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

// ── Droppable zone ────────────────────────────────────────────────────────────

type DroppableZoneProps = {
  zone: ReportBuilderSnapshot["zones"][number];
  selectedCardId?: string;
  onSelectCard: (id: string) => void;
  overZoneId: string | null;
};

function DroppableZone({ zone, selectedCardId, onSelectCard, overZoneId }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${zone.key}` });
  const cardIds = zone.cards.map((c) => c.id);

  return (
    <section
      ref={setNodeRef}
      className={`rounded-[1.55rem] border px-5 py-5 transition-colors ${
        isOver ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-white/10 bg-slate-950/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
            {zone.title}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{zone.purpose}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
          {zone.cards.length} widgets
        </div>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="mt-4 grid gap-3">
          {zone.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              isSelected={card.id === selectedCardId}
              onSelect={onSelectCard}
            />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

// ── BuilderCanvas ─────────────────────────────────────────────────────────────

type BuilderCanvasProps = {
  draftTitle: string;
  periodLabel: string;
  zones: ReportBuilderSnapshot["zones"];
  selectedCardId?: string;
  overZoneId: string | null;
  onSelectCard: (id: string) => void;
};

export function BuilderCanvas({
  draftTitle,
  periodLabel,
  zones,
  selectedCardId,
  overZoneId,
  onSelectCard,
}: BuilderCanvasProps) {
  return (
    <SurfaceCard eyebrow={periodLabel} title={draftTitle}>
      <div className="space-y-1">
        {zones.map((zone, index) => (
          <div key={zone.key}>
            {index === 0 && (
              <BetweenZoneDrop
                id={`between-start-and-${zone.key}`}
                isOver={overZoneId === `between-start-and-${zone.key}`}
              />
            )}

            <DroppableZone
              zone={zone}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              overZoneId={overZoneId}
            />

            <BetweenZoneDrop
              id={`between-${zone.key}-and-${zones[index + 1]?.key ?? "end"}`}
              isOver={
                overZoneId ===
                `between-${zone.key}-and-${zones[index + 1]?.key ?? "end"}`
              }
            />
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
