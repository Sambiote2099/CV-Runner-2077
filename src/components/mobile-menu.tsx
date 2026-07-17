"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

type Props = {
  role: string | undefined
  isLoggedIn: boolean
  userName: string | null
  userImage: string | null
  positions: string
  attributes: string
  users: string
  profile: string
  signIn: string
  signOut: string
}

export default function MobileMenu({
  role,
  isLoggedIn,
  userName,
  userImage,
  positions,
  attributes,
  users,
  profile,
  signIn,
  signOut,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col justify-center gap-1.5 p-2 rounded-md hover:bg-amber-100 dark:hover:bg-slate-700 transition-all duration-300"
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-0.5 bg-slate-700 dark:bg-slate-300 transition-all duration-300 origin-center ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block w-5 h-0.5 bg-slate-700 dark:bg-slate-300 transition-all duration-300 ${open ? "opacity-0 scale-x-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-slate-700 dark:bg-slate-300 transition-all duration-300 origin-center ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 top-24 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown — sits below the search bar (top-24 = 64px header + ~44px search) */}
          <div className="fixed top-24 left-0 w-full bg-amber-50 dark:bg-slate-900 border-b border-amber-200 dark:border-slate-700 shadow-lg flex flex-col px-4 py-3 gap-1 z-50">

            {/* User info */}
            {isLoggedIn && (
              <div className="flex items-center gap-3 px-3 py-2 mb-1 border-b border-amber-100 dark:border-slate-700 pb-3">
                <Image
                  src={userImage ?? "/default-avatar.png"}
                  alt="profile pic"
                  height={36}
                  width={36}
                  className="rounded-full ring-2 ring-amber-300 dark:ring-amber-500 flex-shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {userName ?? "—"}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{role}</span>
                </div>
              </div>
            )}

            {/* Nav links */}
            <Link href="/positions" onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors duration-200">
              {positions}
            </Link>
            {(role === "RECRUITER" || role === "ADMIN") && (
              <Link href="/attributes" onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors duration-200">
                {attributes}
              </Link>
            )}
            {role === "ADMIN" && (
              <Link href="/admin/users" onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors duration-200">
                {users}
              </Link>
            )}
            {isLoggedIn && (
              <Link href="/profile" onClick={() => setOpen(false)} className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors duration-200">
                {profile}
              </Link>
            )}

            {/* Sign in / out */}
            <div className="pt-2 border-t border-amber-100 dark:border-slate-700 mt-1">
              {isLoggedIn ? (
                <Link
                  href="/api/auth/signout"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-semibold text-rose-600 dark:text-rose-400 px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors duration-200"
                >
                  {signOut}
                </Link>
              ) : (
                <Link href="/signin" onClick={() => setOpen(false)} className="block text-sm font-semibold text-amber-600 dark:text-amber-400 px-3 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-slate-800 transition-colors duration-200">
                  {signIn}
                </Link>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  )
}
