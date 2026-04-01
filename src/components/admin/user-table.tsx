"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import type { UserSummary } from "@/lib/db/users";
import {
  updateUserRole,
  setUserWhitelistedAction,
} from "@/features/auth/user-actions";

type Props = {
  initialUsers: UserSummary[];
  currentUserId: string;
};

const ROLE_OPTIONS: UserRole[] = ["viewer", "editor", "approver", "admin"];

export function UserTable({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserSummary[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
    });
  }

  function handleWhitelistedChange(userId: string, isWhitelisted: boolean) {
    startTransition(async () => {
      const updated = await setUserWhitelistedAction(userId, isWhitelisted);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isWhitelisted: updated.isWhitelisted } : u
        )
      );
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm text-white">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Whitelisted</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            return (
              <tr
                key={user.id}
                className="border-b border-white/5 hover:bg-white/3 transition"
              >
                <td className="px-4 py-3">
                  <span className="text-white/90">{user.email}</span>
                  {isCurrentUser && (
                    <span className="ml-2 rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                      you
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/60">
                  {user.name ?? <span className="text-white/25">—</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as UserRole)
                    }
                    disabled={isPending}
                    className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={user.isWhitelisted}
                    onChange={(e) =>
                      handleWhitelistedChange(user.id, e.target.checked)
                    }
                    disabled={isPending}
                    className="h-4 w-4 cursor-pointer accent-[var(--accent)] disabled:opacity-50"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-white/50">
          No users found.
        </div>
      )}
    </div>
  );
}
