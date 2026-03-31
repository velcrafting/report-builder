import { clsx } from "clsx";

const colorMap = {
  draft: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  in_review: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  superseded: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  share_ready: "border-violet-400/30 bg-violet-400/10 text-violet-100",
} as const;

type StatusPillProps = {
  label: string;
  tone: keyof typeof colorMap;
};

export function StatusPill({ label, tone }: StatusPillProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
        colorMap[tone],
      )}
    >
      {label}
    </span>
  );
}
