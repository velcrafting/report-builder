"use client";

import { useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartDatum = {
  label: string;
  approved: number;
  review: number;
  draft: number;
};

type CadenceChartProps = {
  data: ChartDatum[];
};

export function CadenceChart({ data }: CadenceChartProps) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!isClient) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[1.2rem] border border-white/10 bg-slate-950/45 text-sm text-slate-300">
        Loading chart…
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer minWidth={240} minHeight={240}>
        <BarChart data={data} barGap={10}>
          <CartesianGrid stroke="rgba(155,171,197,0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="rgba(216,226,241,0.56)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="rgba(216,226,241,0.42)" tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(155,171,197,0.2)",
              background: "rgba(10,17,28,0.96)",
              color: "#fff",
            }}
          />
          <Bar dataKey="approved" fill="#6ee7b7" radius={[10, 10, 0, 0]} />
          <Bar dataKey="review" fill="#73b9ff" radius={[10, 10, 0, 0]} />
          <Bar dataKey="draft" fill="#f7c15a" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
