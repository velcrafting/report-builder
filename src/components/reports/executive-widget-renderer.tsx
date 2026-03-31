import type { ReportSnapshot } from "@/features/reports/types";

type ExecRenderMode = "card" | "bar" | "quote";
type WidgetKind =
  | "kpi_stat"
  | "sparkline"
  | "time_series"
  | "ranked_bar"
  | "table"
  | "text_insight"
  | "callout"
  | "timeline"
  | "comparison"
  | "quote";

type ExecutiveWidgetRendererProps = {
  kind: WidgetKind;
  mode: ExecRenderMode;
  card: ReportSnapshot["storyBlocks"][number]["cards"][number];
};

function getSeedValues(seed: string, count: number, min = 20, max = 92) {
  let state = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) || 31;
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const normalized = state / 4294967296;
    values.push(Math.round(min + normalized * (max - min)));
  }

  return values;
}

function toNumericArray(value: unknown, fallback: number[]) {
  if (!Array.isArray(value)) return fallback;
  const numbers = value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((item) => Number.isFinite(item));
  return numbers.length ? numbers : fallback;
}

function MiniSparkline({ id, values }: { id: string; values?: unknown }) {
  const resolved = toNumericArray(values, getSeedValues(id, 12, 26, 88));
  const points = resolved
    .map((value, index) => `${(index / (resolved.length - 1)) * 100},${100 - value}`)
    .join(" ");

  return (
    <div className="mt-3 rounded-[0.95rem] border border-white/12 bg-slate-950/65 px-3 py-2">
      <svg viewBox="0 0 100 100" className="h-12 w-full">
        <polyline
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

function TimeSeriesChart({ id, values }: { id: string; values?: unknown }) {
  const resolved = toNumericArray(values, getSeedValues(id, 8, 24, 90));

  return (
    <div className="mt-4 rounded-[1rem] border border-white/12 bg-slate-950/65 px-4 py-3">
      <div className="relative h-32">
        <div className="absolute inset-0 grid grid-rows-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b border-white/8" />
          ))}
        </div>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={resolved
              .map((value, index) => `${(index / (resolved.length - 1)) * 100},${100 - value}`)
              .join(" ")}
          />
        </svg>
      </div>
    </div>
  );
}

function RankedBars({ id, values, labels }: { id: string; values?: unknown; labels?: unknown }) {
  const resolvedValues = toNumericArray(values, getSeedValues(id, 5, 28, 96));
  const fallbackLabels = ["A", "B", "C", "D", "Other"];
  const resolvedLabels = Array.isArray(labels)
    ? labels.map((item) => String(item))
    : fallbackLabels;

  return (
    <div className="mt-4 space-y-2 rounded-[1rem] border border-white/12 bg-slate-950/65 px-4 py-3">
      {resolvedValues.map((value, index) => (
        <div key={`${id}-${resolvedLabels[index] ?? index}`} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>{resolvedLabels[index] ?? `Item ${index + 1}`}</span>
            <span>{value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[var(--accent)]/85" style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceTable({ id, rows }: { id: string; rows?: unknown }) {
  const values = getSeedValues(id, 3, 12, 87);
  const fallbackRows = [
    { label: "Source confidence", value: `${values[0]}%` },
    { label: "Coverage quality", value: `${values[1]}%` },
    { label: "Signal consistency", value: `${values[2]}%` },
  ];
  const resolvedRows = Array.isArray(rows)
    ? rows
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const candidate = row as { label?: unknown; value?: unknown };
          if (!candidate.label || candidate.value === undefined) return null;
          return {
            label: String(candidate.label),
            value: String(candidate.value),
          };
        })
        .filter((row): row is { label: string; value: string } => Boolean(row))
    : fallbackRows;

  return (
    <div className="mt-4 overflow-hidden rounded-[1rem] border border-white/12">
      <table className="min-w-full divide-y divide-white/10 text-left text-xs">
        <tbody className="divide-y divide-white/10 bg-slate-950/55">
          {resolvedRows.map((row) => (
            <tr key={row.label}>
              <td className="px-3 py-2 text-white/75">{row.label}</td>
              <td className="px-3 py-2 text-right font-semibold text-white">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TimelineRail({ id, events }: { id: string; events?: unknown }) {
  const fallback = ["Baseline", "Shift", "Decision", "Next step"];
  const labels = Array.isArray(events)
    ? events
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") return item;
          if (typeof item === "object" && "label" in item && (item as { label?: unknown }).label) {
            return String((item as { label?: unknown }).label);
          }
          return null;
        })
        .filter((item): item is string => Boolean(item))
    : fallback;

  return (
    <div className="mt-4 rounded-[1rem] border border-white/12 bg-slate-950/65 px-4 py-3">
      <ol className="space-y-3">
        {labels.map((label, index) => (
          <li key={`${id}-${label}`} className="relative pl-6 text-sm text-slate-200">
            <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            {index < labels.length - 1 ? (
              <span className="absolute left-[4px] top-4 h-5 w-px bg-white/20" />
            ) : null}
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ComparisonBlock(card: ReportSnapshot["storyBlocks"][number]["cards"][number]) {
  const data = card.widgetData ?? {};
  const current = typeof data.current === "number" ? data.current : 78;
  const prior = typeof data.prior === "number" ? data.prior : 61;

  return (
    <div className="mt-4 space-y-3 rounded-[1rem] border border-white/12 bg-slate-950/65 px-4 py-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/55">
        <span>Current period</span>
        <span>{card.metric ?? "+12%"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${current}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/45">
        <span>Prior period</span>
        <span>{card.supportingLabel ?? "Baseline"}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white/40" style={{ width: `${prior}%` }} />
      </div>
    </div>
  );
}

export function ExecutiveWidgetRenderer({ kind, mode, card }: ExecutiveWidgetRendererProps) {
  if (mode === "quote" || kind === "quote") {
    return (
      <div className="mt-3 rounded-[1rem] border border-[var(--accent)]/35 bg-[var(--accent)]/12 px-4 py-4">
        <p className="text-xl leading-8 tracking-[-0.02em] text-orange-50">&ldquo;{card.body}&rdquo;</p>
        {card.metric ? <p className="mt-3 text-sm font-semibold text-orange-100">{card.metric}</p> : null}
      </div>
    );
  }

  if (kind === "comparison") {
    return ComparisonBlock(card);
  }

  if (kind === "kpi_stat") {
    return (
      <>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
        <div className="mt-4 rounded-[1rem] border border-white/12 bg-white/5 px-4 py-3">
          <p className="text-3xl font-semibold tracking-[-0.05em] text-white">{card.metric ?? "1.42M"}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
            {card.supportingLabel ?? "+12% vs prior period"}
          </p>
        </div>
        <MiniSparkline id={card.id} values={card.widgetData?.values} />
      </>
    );
  }

  if (kind === "sparkline") {
    return (
      <>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
        <MiniSparkline id={card.id} values={card.widgetData?.values} />
      </>
    );
  }

  if (kind === "time_series") {
    return (
      <>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
        <TimeSeriesChart id={card.id} values={card.widgetData?.values} />
      </>
    );
  }

  if (kind === "ranked_bar") {
    return (
      <>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
        <RankedBars id={card.id} values={card.widgetData?.values} labels={card.widgetData?.labels} />
      </>
    );
  }

  if (kind === "table") {
    return (
      <>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
        <EvidenceTable id={card.id} rows={card.widgetData?.rows} />
      </>
    );
  }

  if (kind === "timeline") {
    return (
      <>
        <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
        <TimelineRail id={card.id} events={card.widgetData?.events} />
      </>
    );
  }

  if (kind === "callout") {
    return (
      <div className="mt-4 rounded-[1rem] border border-amber-400/25 bg-amber-400/10 px-4 py-3">
        <p className="text-sm leading-6 text-amber-100">{card.body}</p>
      </div>
    );
  }

  if (mode === "bar") {
    return ComparisonBlock(card);
  }

  return (
    <>
      <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
      {card.metric ? (
        <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-3xl font-semibold tracking-[-0.05em] text-white">{card.metric}</p>
          {card.supportingLabel ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{card.supportingLabel}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
