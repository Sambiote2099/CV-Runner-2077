"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { createSupportTicket } from "@/app/support/actions"
import { HelpCircle, X } from "lucide-react"

type Priority = "High" | "Average" | "Low"

export default function SupportTicketButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState("")
  const [priority, setPriority] = useState<Priority>("Average")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  function reset() {
    setSummary("")
    setPriority("Average")
    setStatus("idle")
    setErrorMsg("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!summary.trim()) return
    setLoading(true)

    // window.location.href gives the full absolute URL — needed so the
    // "Link" field in the ticket is clickable from the email
    const link = typeof window !== "undefined" ? window.location.href : pathname

    const result = await createSupportTicket({ summary, priority, link })

    if (result.error) {
      setStatus("error")
      setErrorMsg(result.error)
    } else {
      setStatus("success")
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 cursor-pointer right-5 z-40 flex items-center gap-1 rounded-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-900 shadow-lg px-3 py-1.5 font-semibold text-sm transition-all duration-300"
        aria-label="Create support ticket"
      >
        <HelpCircle size={18} />
        <span className="hidden sm:inline">Help</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-amber-100 dark:border-slate-700 shadow-xl p-6 flex flex-col gap-4">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-amber-100">
                Create Support Ticket
              </h2>
              <button onClick={() => { setOpen(false); reset() }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            {status === "success" ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  ✓ Ticket submitted. Admins will be notified shortly.
                </p>
                <button
                  onClick={() => { setOpen(false); reset() }}
                  className="self-start rounded-2xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold transition-all duration-300"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Summary
                  </label>
                  <textarea
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                    placeholder="Describe the issue…"
                    className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full rounded-lg border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="High">High</option>
                    <option value="Average">Average</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {status === "error" && (
                  <p className="rounded-lg border border-rose-300 bg-rose-50 dark:bg-rose-900/20 p-2 text-sm text-rose-600 dark:text-rose-400">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 text-sm font-semibold transition-all duration-300"
                >
                  {loading ? "Submitting…" : "Submit Ticket"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}