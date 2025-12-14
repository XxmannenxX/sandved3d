"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Database } from "@/types/supabase"
import { Search, Filter, ChevronLeft } from "lucide-react"

type AuditLogRow = Database["public"]["Tables"]["admin_audit_logs"]["Row"]

function formatWhen(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
}

function shortId(id: string | null) {
  if (!id) return "—"
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}

function getAdminLabel(log: AuditLogRow) {
  const md: any = log.metadata || {}
  const email = typeof md?.admin_email === "string" ? md.admin_email : ""
  if (email) return email
  return shortId(log.admin_user_id)
}

function renderDetails(log: AuditLogRow) {
  const md: any = log.metadata || {}
  if (md?.field === "status") {
    const from = md?.from ?? "—"
    const to = md?.to ?? "—"
    const customerEmail = typeof md?.customer_email === "string" ? md.customer_email : ""
    return (
      <span className="text-xs">
        {customerEmail ? (
          <>
            <span className="font-mono text-[11px] text-muted-foreground">{customerEmail}</span>{" "}
            ·{" "}
          </>
        ) : null}
        status:{" "}
        <span className="font-mono text-[11px] text-muted-foreground">{String(from)}</span> →{" "}
        <span className="font-mono text-[11px] text-muted-foreground">{String(to)}</span>
      </span>
    )
  }

  if (md && Object.keys(md).length > 0) {
    return <span className="font-mono text-xs">{JSON.stringify(md)}</span>
  }

  return "—"
}

export default function LogsClient({ initialLogs }: { initialLogs: AuditLogRow[] }) {
  const [q, setQ] = useState("")
  const [table, setTable] = useState("")

  const tableOptions = useMemo(() => {
    const set = new Set<string>()
    for (const l of initialLogs) {
      if (l.table_name) set.add(l.table_name)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [initialLogs])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return initialLogs.filter((l) => {
      if (table && l.table_name !== table) return false
      if (!query) return true
      const hay = [
        l.action,
        l.table_name,
        l.record_id,
        l.admin_user_id,
        l.metadata ? JSON.stringify(l.metadata) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(query)
    })
  }, [initialLogs, q, table])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm sm:text-base text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft suppressHydrationWarning className="w-4 h-4 mr-1" />
        Tilbake til admin
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit logs</h1>
          <p className="text-muted-foreground mt-1">
            Logger admin-handlinger (produkter, innstillinger, ordrestatus).
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Viser {filtered.length} av {initialLogs.length}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/10">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:w-[380px]">
              <Search
                suppressHydrationWarning
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Søk på bruker, tabell, action, record id…"
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-60">
                <Filter
                  suppressHydrationWarning
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                />
                <select
                  value={table}
                  onChange={(e) => setTable(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Alle tabeller</option>
                  {tableOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQ("")
                  setTable("")
                }}
                className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Nullstill
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Ingen treff.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/10 border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Tid</th>
                  <th className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Bruker</th>
                  <th className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Tabell</th>
                  <th className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Record</th>
                  <th className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Detaljer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatWhen(l.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {getAdminLabel(l)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-md border border-border bg-background text-foreground font-medium">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{l.table_name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {shortId(l.record_id)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {renderDetails(l)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


