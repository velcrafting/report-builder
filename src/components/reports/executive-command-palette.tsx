"use client";

import { useEffect, useId, useMemo, useRef } from "react";

export type ExecutiveCommandPaletteAction = {
  id: string;
  label: string;
  description?: string;
  shortcutHint?: string;
  keywords?: string[];
  disabled?: boolean;
};

export type ExecutiveCommandPaletteProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  keyboardHintText?: string;
  searchPlaceholder?: string;
  emptyStateText?: string;
  query: string;
  actions: ExecutiveCommandPaletteAction[];
  onQueryChange: (query: string) => void;
  onSelect: (action: ExecutiveCommandPaletteAction) => void;
  onClose: () => void;
  className?: string;
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function actionMatchesQuery(action: ExecutiveCommandPaletteAction, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [action.label, action.description, action.shortcutHint, ...(action.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function ExecutiveCommandPalette({
  open,
  title = "Command palette",
  subtitle = "Search executive preview actions",
  keyboardHintText = "Enter to select, Esc to close",
  searchPlaceholder = "Search actions",
  emptyStateText = "No actions match your search.",
  query,
  actions,
  onQueryChange,
  onSelect,
  onClose,
  className,
}: ExecutiveCommandPaletteProps) {
  const labelId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = normalizeQuery(query);

  const filteredActions = useMemo(
    () => actions.filter((action) => actionMatchesQuery(action, normalizedQuery)),
    [actions, normalizedQuery],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (document.activeElement === inputRef.current) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={className}>
      <div
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-[2px]"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 sm:items-center sm:px-6 lg:px-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          onMouseDown={(event) => event.stopPropagation()}
          className="w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-slate-950/95 shadow-[0_30px_100px_rgba(3,6,18,0.55)]"
        >
          <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div>
                <h2 id={labelId} className="text-lg font-semibold tracking-[-0.03em] text-white">
                  {title}
                </h2>
                <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-300">
                  {subtitle}
                </p>
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">{keyboardHintText}</p>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Search</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-[1rem] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[var(--accent)]/45"
              />
            </label>

            <div className="max-h-[48vh] overflow-y-auto pr-1">
              {filteredActions.length > 0 ? (
                <div className="space-y-2">
                  {filteredActions.map((action) => {
                    const disabled = Boolean(action.disabled);

                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(action)}
                        className="flex w-full items-start justify-between gap-4 rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <span className="min-w-0 space-y-1">
                          <span className="block text-sm font-medium text-white">{action.label}</span>
                          {action.description ? (
                            <span className="block text-sm leading-6 text-slate-300">{action.description}</span>
                          ) : null}
                        </span>
                        {action.shortcutHint ? (
                          <span className="shrink-0 rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
                            {action.shortcutHint}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
                  <p className="text-sm text-slate-300">{emptyStateText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
