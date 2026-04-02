// src/components/reports/flywheel-tray/flywheel-tray.tsx
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DataFieldsTab } from "./data-fields-tab";
import { WidgetsTab } from "./widgets-tab";
import { TemplatesTab } from "./templates-tab";
import type { FieldSuggestion } from "@/features/imports/field-suggestions-action";
import type { WidgetKind } from "@/features/widgets/types";

type Tab = "data" | "widgets" | "templates";

type FlywheelTrayProps = {
  section: string;
  fields: FieldSuggestion[];
  onAddBlankWidget: (kind: WidgetKind) => void;
  onApplyPreset: (presetId: string) => void;
};

export function FlywheelTray({
  section,
  fields,
  onAddBlankWidget,
  onApplyPreset,
}: FlywheelTrayProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("data");

  const tabs: { id: Tab; label: string }[] = [
    { id: "data", label: "Data Fields" },
    { id: "widgets", label: "Widgets" },
    { id: "templates", label: "Templates" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Tray panel — slides up above the button */}
      {open && (
        <>
          {/* Backdrop dismiss */}
          <button
            type="button"
            aria-label="Close tray"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-transparent"
          />
          <div className="relative z-40 flex h-[420px] w-[280px] flex-col overflow-hidden rounded-[1.25rem] border border-white/15 bg-[#0d1525] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {/* Tab bar */}
            <div className="flex flex-shrink-0 border-b border-white/10">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-[0.67rem] font-semibold uppercase tracking-[0.12em] transition ${
                    activeTab === tab.id
                      ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content — scrollable */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "data" && (
                <DataFieldsTab fields={fields} section={section} />
              )}
              {activeTab === "widgets" && (
                <WidgetsTab onAddBlank={onAddBlankWidget} />
              )}
              {activeTab === "templates" && (
                <TemplatesTab onApplyPreset={onApplyPreset} />
              )}
            </div>
          </div>
        </>
      )}

      {/* Trigger button */}
      <button
        type="button"
        aria-label={open ? "Close tray" : "Open add tray"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] shadow-[0_8px_24px_rgba(242,141,73,0.4)] transition hover:opacity-90 active:scale-95"
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <Plus className="h-5 w-5 text-white" />
        )}
      </button>
    </div>
  );
}
