"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveDraftAction,
  type OutputVersionSummary,
} from "@/features/reports/approval-actions";

type ApprovalPanelProps = {
  draftId: string;
  currentStatus: string;
  outputVersions: OutputVersionSummary[];
};

export function ApprovalPanel({
  draftId,
  currentStatus,
  outputVersions,
}: ApprovalPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      await approveDraftAction(draftId);
      router.refresh();
    });
  }

  const hasApprovedVersions = outputVersions.some((v) => v.state === "approved");

  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/5 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Approval</h3>

      {currentStatus === "in_review" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            This draft is ready for approval. Approving will create a versioned
            output snapshot.
          </p>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Approving…
              </>
            ) : (
              "Approve Draft"
            )}
          </button>
        </div>
      )}

      {currentStatus === "draft" && (
        <p className="text-xs text-slate-500 italic">
          Submit for review before approving.
        </p>
      )}

      {hasApprovedVersions && (
        <div className="space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">Approved</span>
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide pt-1">
            Output Versions
          </p>
          <ul className="space-y-2">
            {outputVersions
              .filter((v) => v.state === "approved")
              .map((version) => (
                <li
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="text-sm font-medium text-slate-200">
                    v{version.versionNumber}
                  </span>
                  <span className="text-xs text-slate-500">
                    {version.approvedAt
                      ? new Date(version.approvedAt).toLocaleDateString()
                      : "—"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
