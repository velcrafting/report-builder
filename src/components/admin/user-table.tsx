"use client";

import { useState, useTransition } from "react";
import type { UserRole } from "@prisma/client";
import type { UserSummary } from "@/lib/db/users";
import {
  updateUserRole,
  setUserWhitelistedAction,
  createUserAction,
  deleteUserAction,
} from "@/features/auth/user-actions";

type Props = {
  initialUsers: UserSummary[];
  currentUserId: string;
  currentUserRole: UserRole;
};

const ROLE_OPTIONS: UserRole[] = ["viewer", "editor", "approver", "admin"];

const ROLE_RANK: Record<UserRole, number> = {
  admin: 4,
  approver: 3,
  editor: 2,
  viewer: 1,
};

type RoleFilter = "all" | UserRole;

const FILTER_TABS: { key: RoleFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin" },
  { key: "approver", label: "Approver" },
  { key: "editor", label: "Editor" },
  { key: "viewer", label: "Viewer" },
];

export function UserTable({ initialUsers, currentUserId, currentUserRole }: Props) {
  const [users, setUsers] = useState<UserSummary[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  // Role filter
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("viewer");
  const [addError, setAddError] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredUsers =
    roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

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

  function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const email = newEmail.trim();
    if (!email) {
      setAddError("Email is required.");
      return;
    }
    startTransition(async () => {
      const result = await createUserAction(email, newRole);
      if (result.error) {
        setAddError(result.error);
        return;
      }
      if (result.user) {
        setUsers((prev) => [...prev, result.user!]);
      }
      setNewEmail("");
      setNewRole("viewer");
      setShowAddForm(false);
    });
  }

  function handleDeleteConfirmed(userId: string) {
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (!result.error) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
      setConfirmDeleteId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Header row: filter tabs + Add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Role filter tabs */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 flex-wrap">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                roleFilter === key
                  ? "bg-[var(--accent)] text-slate-950"
                  : "border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Add user button */}
        <button
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError(null);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          <span className="text-base leading-none">+</span>
          Add user
        </button>
      </div>

      {/* Inline add-user form */}
      {showAddForm && (
        <form
          onSubmit={handleAddUser}
          className="flex flex-col sm:flex-row gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-white/10 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            />
            {addError && (
              <p className="mt-1 text-xs text-red-400">{addError}</p>
            )}
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as UserRole)}
            disabled={isPending}
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-slate-950 hover:opacity-90 transition disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError(null);
                setNewEmail("");
                setNewRole("viewer");
              }}
              disabled={isPending}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 hover:text-white transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* User table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Whitelisted</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const canDelete =
                !isCurrentUser &&
                ROLE_RANK[currentUserRole] > ROLE_RANK[user.role];
              const isConfirming = confirmDeleteId === user.id;

              return (
                <tr
                  key={user.id}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition"
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
                  <td className="px-4 py-3 text-right">
                    {canDelete && !isConfirming && (
                      <button
                        onClick={() => setConfirmDeleteId(user.id)}
                        disabled={isPending}
                        className="rounded px-2 py-1 text-xs text-white/40 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                        title="Remove user"
                      >
                        Remove
                      </button>
                    )}
                    {canDelete && isConfirming && (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-white/50">Sure?</span>
                        <button
                          onClick={() => handleDeleteConfirmed(user.id)}
                          disabled={isPending}
                          className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                        >
                          Yes, remove
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isPending}
                          className="rounded px-2 py-1 text-xs text-white/40 hover:text-white transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-white/50">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
