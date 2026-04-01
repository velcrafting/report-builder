"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Trash2, Link2, Plus, Loader2 } from "lucide-react";
import type { ShareLinkRow } from "@/lib/db/shareLinks";
import {
  createShareLinkAction,
  deleteShareLinkAction,
} from "@/features/reports/share-actions";

type SharePanelProps = {
  outputVersionId: string;
  initialShareLinks: ShareLinkRow[];
};

export function SharePanel({ outputVersionId, initialShareLinks }: SharePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [links, setLinks] = useState<ShareLinkRow[]>(initialShareLinks);
  const [labelInput, setLabelInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  function buildShareUrl(token: string): string {
    return `${window.location.origin}/share/output/${token}`;
  }

  async function handleCopy(link: ShareLinkRow) {
    try {
      await navigator.clipboard.writeText(buildShareUrl(link.token));
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback: silently fail
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const newLink = await createShareLinkAction(outputVersionId, labelInput || undefined);
      setLinks((prev) => [newLink, ...prev]);
      setLabelInput("");
    } finally {
      setIsGenerating(false);
      startTransition(() => router.refresh());
    }
  }

  function handleDelete(linkId: string) {
    startTransition(async () => {
      await deleteShareLinkAction(linkId);
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      router.refresh();
    });
  }

  const tokenDisplay = (token: string) =>
    token.length > 16 ? `${token.slice(0, 8)}…${token.slice(-6)}` : token;

  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-white/5 px-6 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link2 className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
          Share links
        </h3>
      </div>

      {/* Existing links */}
      {links.length === 0 ? (
        <p className="text-sm text-slate-400">No share links yet. Generate one below.</p>
      ) : (
        <ul className="space-y-2.5">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-slate-950/50 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {link.label ?? "Unnamed link"}
                </p>
                <p className="mt-0.5 font-mono text-[0.72rem] text-slate-400">
                  {tokenDisplay(link.token)}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={() => handleCopy(link)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 active:scale-95"
                title="Copy share URL"
              >
                {copiedId === link.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDelete(link.id)}
                disabled={isPending}
                className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                title="Revoke share link"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Generate new link */}
      <div className="rounded-[1.1rem] border border-white/10 bg-slate-950/40 px-4 py-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
          Generate share link
        </p>
        <input
          type="text"
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          placeholder="Optional label (e.g. Board review)"
          className="w-full rounded-[0.9rem] border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition"
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)] disabled:opacity-50 active:scale-95"
        >
          {isGenerating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Generate link
        </button>
      </div>
    </div>
  );
}
