"use client"

import { useState } from "react"
import { pushToSalesforce } from "./salesforce-actions"

// Matches the regex used server-side in salesforce-actions.ts —
// kept in sync so the client can show an inline error before submitting.
const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/

type Props = {
  // Pre-filled from profile — shown read-only so user knows what's being sent
  firstName: string
  lastName: string
  email: string
}

type Result = {
  accountId: string
  contactId: string
}

export default function SalesforceForm({ firstName, lastName, email }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  // Form fields
  const [phone, setPhone] = useState("")
  const [site, setSite] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [languages, setLanguages] = useState("")
  const [description, setDescription] = useState("")

  function validatePhone(value: string) {
    if (value.trim() && !PHONE_REGEX.test(value.trim())) {
      setPhoneError("Use digits, spaces, +, -, and parentheses only (7–20 characters).")
    } else {
      setPhoneError(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      setPhoneError("Use digits, spaces, +, -, and parentheses only (7–20 characters).")
      return
    }

    setLoading(true)

    const res = await pushToSalesforce({
      phone,
      site,
      jobTitle,
      department,
      birthdate,
      languages,
      description,
    })

    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    setResult({ accountId: res.accountId!, contactId: res.contactId! })
    setLoading(false)
  }

  function handleReset() {
    setOpen(false)
    setResult(null)
    setError(null)
    setPhoneError(null)
    setPhone("")
    setSite("")
    setJobTitle("")
    setDepartment("")
    setBirthdate("")
    setLanguages("")
    setDescription("")
  }

  // ── Success state ──
  if (result) {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex flex-col gap-3">
        <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
          ✓ Successfully pushed to Salesforce
        </h3>
        <div className="text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-1">
          <p>
            <span className="font-medium">Account ID:</span>{" "}
            <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded text-xs">
              {result.accountId}
            </code>
          </p>
          <p>
            <span className="font-medium">Contact ID:</span>{" "}
            <code className="bg-emerald-100 dark:bg-emerald-900/40 px-1 rounded text-xs">
              {result.contactId}
            </code>
          </p>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          An Account and linked Contact have been created in Salesforce CRM.
        </p>
        <button
          onClick={handleReset}
          className="self-start rounded-2xl border border-slate-200 dark:border-slate-600 px-3 py-1 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
        >
          Done
        </button>
      </div>
    )
  }

  // ── Collapsed state — just a button ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-[#00A1E0] text-[#00A1E0] hover:bg-[#00A1E0] hover:text-white dark:border-[#00A1E0] dark:text-[#00A1E0] dark:hover:bg-[#00A1E0] dark:hover:text-white px-4 py-2 text-sm font-semibold transition-all duration-300"
      >
        {/* Salesforce cloud icon as SVG — no external dependency needed */}
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.071 2.235a5.64 5.64 0 0 1 3.858 1.524 7.11 7.11 0 0 1 4.553-1.648c3.937 0 7.129 3.192 7.129 7.13 0 .98-.198 1.912-.556 2.76A5.64 5.64 0 0 1 26.64 17.13a5.64 5.64 0 0 1-5.64 5.64 5.6 5.6 0 0 1-2.507-.591A6.34 6.34 0 0 1 13.5 24a6.34 6.34 0 0 1-5.31-2.876 5.12 5.12 0 0 1-1.69.287A5.13 5.13 0 0 1 1.37 16.28a5.1 5.1 0 0 1 .97-3.02 4.5 4.5 0 0 1-.34-1.71 4.52 4.52 0 0 1 4.52-4.52c.34 0 .67.038.99.108a5.64 5.64 0 0 1 2.561-4.903z"/>
        </svg>
        Push to Salesforce CRM
      </button>
    )
  }

  // ── Expanded form ──
  return (
    <div className="rounded-xl border border-[#00A1E0]/30 dark:border-[#00A1E0]/20 bg-white dark:bg-slate-800 p-5 flex flex-col gap-4 shadow-sm">

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-amber-100">
          Push to Salesforce CRM
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Read-only preview — shows what's being sent from profile.
          Account.Name will be set to First + Last Name below. */}
      <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
          From your profile (non-removable fields — also used as the Account name)
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-slate-400">First Name</span>
            <p className={`font-medium ${!firstName ? "text-rose-400 italic" : "text-slate-700 dark:text-slate-200"}`}>
              {firstName || "Not filled in"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Last Name</span>
            <p className={`font-medium ${!lastName ? "text-rose-400 italic" : "text-slate-700 dark:text-slate-200"}`}>
              {lastName || "Not filled in"}
            </p>
          </div>
          <div className="col-span-2">
            <span className="text-xs text-slate-400">Email</span>
            <p className="font-medium text-slate-700 dark:text-slate-200">{email}</p>
          </div>
        </div>
        {(!firstName || !lastName) && (
          <p className="text-xs text-rose-500 mt-1">
            ⚠ Fill in First Name and Last Name in the Me tab first.
          </p>
        )}
      </div>

      {/* Additional info form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          Additional information
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                validatePhone(e.target.value)
              }}
              placeholder="+1 555 000 0000"
              className={`w-full rounded-lg border bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${
                phoneError
                  ? "border-rose-300 focus:ring-rose-400"
                  : "border-amber-200 dark:border-slate-600 focus:ring-[#00A1E0]"
              }`}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-rose-500">{phoneError}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Site
            </label>
            <input
              type="text"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="Headquarters, Remote…"
              className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Software Engineer"
              className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
              className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Birthdate
            </label>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Languages
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Bengali"
              className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Description / Notes
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any additional notes about this contact…"
            className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00A1E0] resize-none"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !!phoneError}
            className="rounded-2xl bg-[#00A1E0] hover:bg-[#0086be] px-4 py-2 text-sm text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Pushing to Salesforce…" : "Create Account & Contact"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-2xl border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
