"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { blockUser, unblockUser, deleteUser, setUserRole } from "./actions"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Lock, LockOpen, Trash2 } from "lucide-react"

type Role = "CANDIDATE" | "RECRUITER" | "ADMIN"

type User = {
  id: string
  name: string | null
  email: string
  role: Role
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
  emailVerified: Date | null
  image: string | null
}

export default function UserTable({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const t = useTranslations("Admin")
  const tCommon = useTranslations("Common")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const selectedUsers = users.filter((u) => selectedIds.has(u.id))
  const noneSelected = selectedIds.size === 0
  const allSelected = users.length > 0 && selectedIds.size === users.length
  const someSelected = selectedIds.size > 0 && !allSelected

  // For block/unblock: show "unblock" if majority are blocked, else "block"
  const blockedCount = selectedUsers.filter((u) => u.isBlocked).length
  const showUnblock = blockedCount > selectedUsers.length / 2

  // Can't block/delete the current user
  const allSafe = selectedUsers.every((u) => u.id !== currentUserId)

  // Role change only makes sense for single selection
  const singleSelected = selectedUsers.length === 1 ? selectedUsers[0] : null

  // Keep select-all checkbox indeterminate in sync
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)))
    }
  }

  async function runForEach(
    fn: (id: string) => Promise<{ error?: string }>,
    successMsg: string
  ) {
    setLoading(true)
    const ids = [...selectedIds]
    let errorCount = 0
    for (const id of ids) {
      const result = await fn(id)
      if (result?.error) errorCount++
    }
    if (errorCount > 0) toast.error(t("someActionsFailed"))
    else toast.success(successMsg)
    setSelectedIds(new Set())
    setLoading(false)
    router.refresh()
  }

  async function handleRoleChange(role: Role) {
    if (!singleSelected) return
    setLoading(true)
    const result = await setUserRole(singleSelected.id, role)
    if (result?.error) toast.error(result.error)
    else toast.success(t("roleUpdated"))
    setLoading(false)
    router.refresh()
  }

  async function handleBlock() {
    await runForEach(blockUser, t("userBlocked"))
  }

  async function handleUnblock() {
    await runForEach(unblockUser, t("userUnblocked"))
  }

  async function handleDelete() {
    const names = selectedUsers.map((u) => u.name ?? u.email).join(", ")
    if (!window.confirm(t("deleteUserConfirm", { name: names }))) return
    await runForEach(deleteUser, t("userDeleted"))
  }

  return (
    <div>
      {/* Toolbar — always visible, disabled when nothing selected */}
      <div className="mb-3 flex min-h-[40px] flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 dark:text-slate-500 mr-1">
          {noneSelected ? t("selectRowHint") : t("selectedCount", { count: selectedIds.size })}
        </span>

        {/* Role selector — single selection only */}
        <select
          value={singleSelected?.role ?? ""}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
          disabled={!singleSelected || loading}
          className="rounded-lg border border-amber-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-200"
        >
          {singleSelected ? (
            Object.values(Role).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))
          ) : (
            <option value="">— role —</option>
          )}
        </select>

        {showUnblock ? (
          <button
            onClick={handleUnblock}
            disabled={noneSelected || loading}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-3 py-1 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <LockOpen size={14} />
            {t("unblock")}
          </button>
        ) : (
          <button
            onClick={handleBlock}
            disabled={noneSelected || !allSafe || loading}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700 px-3 py-1 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Lock size={14} />
            {t("block")}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={noneSelected || !allSafe || loading}
          className="flex items-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-1 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} />
          {tCommon("delete")}
        </button>
      </div>

      <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-slate-700 shadow-sm overflow-x-auto sm:overflow-visible">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-amber-100 dark:border-slate-600 font-semibold text-slate-600 dark:text-slate-300">
              <th className="w-8 py-2 pl-4">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-amber-500 cursor-pointer"
                />
              </th>
              <th className="py-2 pr-4">{t("colName")}</th>
              <th className="py-2 pr-4">{t("colEmail")}</th>
              <th className="py-2 pr-4">{t("colRole")}</th>
              <th className="py-2 pr-4">{t("colStatus")}</th>
              <th className="py-2">{t("colJoined")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                onClick={() => toggleRow(user.id)}
                className={`cursor-pointer hover:scale-102 border-b border-amber-50 dark:border-slate-700 transition-all duration-300 ${
                  selectedIds.has(user.id)
                    ? "bg-amber-100 dark:bg-slate-600"
                    : "hover:bg-amber-50 dark:hover:bg-slate-700"
                }`}
              >
                <td className="py-2 pl-4">
                  <input
                    type="checkbox"
                    readOnly
                    checked={selectedIds.has(user.id)}
                    className="pointer-events-none accent-amber-500"
                  />
                </td>
                <td className="py-2 pr-4 font-medium">
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200"
                  >
                    {user.name ?? "—"}
                  </Link>
                  {user.id === currentUserId && (
                    <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">({t("you")})</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{user.email}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                      : user.role === "RECRUITER"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {user.isBlocked ? (
                    <span className="rounded-full bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
                      {t("blocked")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {t("active")}
                    </span>
                  )}
                </td>
                <td className="py-2 text-slate-400 dark:text-slate-500">
                  {user.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
