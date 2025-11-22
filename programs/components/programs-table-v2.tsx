"use client"

/* new sortable, searchable, paginated table view */
import { useMemo, useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Program = {
  name: string
  program_url: string
  logo: string
  is_new?: boolean
  platform: string
  reward: string
  last_updated: string
  inscope_domains?: string[]
  outofscope_domains?: string[]
}

type SortKey = "date" | "name" | "new" | "platform" | "reward"

const PAGE_SIZE = 100

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
  } catch {
    return d
  }
}

function parseRewardHigh(reward: string): number {
  // Reward strings like "$200 - $25,000" or "$0 - $103,000"
  const nums = reward.replace(/[^0-9\-\s,]/g, "").split("-")
  const high = (nums[1] || nums[0] || "0").replace(/,/g, "").trim()
  const n = Number(high)
  return Number.isFinite(n) ? n : 0
}

export default function ProgramsTableV2({ programs }: { programs: Program[] }) {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [direction, setDirection] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setDirection(key === "name" || key === "platform" ? "asc" : "desc")
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return programs
    return programs.filter((p) => p.name.toLowerCase().includes(q))
  }, [programs, query])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === "date") {
        cmp = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
      } else if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortKey === "platform") {
        cmp = a.platform.localeCompare(b.platform)
      } else if (sortKey === "new") {
        // true first when desc
        cmp = Number(a.is_new) - Number(b.is_new)
      } else if (sortKey === "reward") {
        cmp = parseRewardHigh(a.reward) - parseRewardHigh(b.reward)
      }
      return direction === "asc" ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, direction])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const startIndex = (current - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, total)
  const pageItems = sorted.slice(startIndex, endIndex)

  const SortIcon = ({ active }: { active: boolean }) =>
    active ? (
      direction === "asc" ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="ml-1 h-3.5 w-3.5" />
      )
    ) : (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
    )

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      {/* Search */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Search program name..."
          aria-label="Search programs by name"
          className="max-w-md"
        />
        <div className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : startIndex + 1}-{endIndex} of {total}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th
                role="button"
                onClick={() => toggleSort("date")}
                className="px-3 py-2 font-medium cursor-pointer select-none"
              >
                DATE <SortIcon active={sortKey === "date"} />
              </th>
              <th
                role="button"
                onClick={() => toggleSort("name")}
                className="px-3 py-2 font-medium cursor-pointer select-none"
              >
                NAME <SortIcon active={sortKey === "name"} />
              </th>
              <th
                role="button"
                onClick={() => toggleSort("new")}
                className="px-3 py-2 font-medium cursor-pointer select-none"
              >
                NEW <SortIcon active={sortKey === "new"} />
              </th>
              <th
                role="button"
                onClick={() => toggleSort("platform")}
                className="px-3 py-2 font-medium cursor-pointer select-none"
              >
                PLATFORM <SortIcon active={sortKey === "platform"} />
              </th>
              <th
                role="button"
                onClick={() => toggleSort("reward")}
                className="px-3 py-2 font-medium cursor-pointer select-none"
              >
                REWARD <SortIcon active={sortKey === "reward"} />
              </th>
              <th className="px-3 py-2 font-medium">LINK</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p.name} className="border-t border-border">
                {/* DATE */}
                <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatDate(p.last_updated)}</td>

                {/* NAME with logo */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.logo || "/placeholder.svg?height=24&width=24&query=program%20logo"}
                      alt={`${p.name} logo`}
                      className="h-6 w-6 rounded"
                      width={24}
                      height={24}
                      crossOrigin="anonymous"
                    />
                    <span className="font-medium text-foreground text-pretty">{p.name}</span>
                  </div>
                </td>

                {/* NEW: green check mark when is_new */}
                <td className="px-3 py-3">
                  {p.is_new ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-success">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      {/* <span className="text-xs font-medium">New</span> */}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* PLATFORM */}
                <td className="px-3 py-3 whitespace-nowrap">{p.platform}</td>

                {/* REWARD */}
                <td className="px-3 py-3 whitespace-nowrap font-medium text-success">{p.reward}</td>

                {/* LINK */}
                <td className="px-3 py-3">
                  <a
                    href={p.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-link px-3 py-1.5 text-link-foreground hover:opacity-90"
                    aria-label={`Visit ${p.name} program`}
                  >
                    Visit <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No programs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {current} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={current <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={current >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
