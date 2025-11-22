"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ProgramCard from "./program-card"

type Program = {
  name: string
  program_url: string
  logo: string
  is_new?: boolean
  platform: string
  reward: string
  last_updated: string // YYYY-MM-DD
  inscope_domains?: string[]
  outofscope_domains?: string[]
}

type Props = {
  initialPrograms: Program[]
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  // Fallback for invalid date
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

export default function ProgramsBrowser({ initialPrograms }: Props) {
  const [query, setQuery] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [sort, setSort] = useState<"newest" | "oldest">("newest")
  const [perPage, setPerPage] = useState<number>(25)
  const [page, setPage] = useState<number>(1)

  const platforms = useMemo(() => {
    return Array.from(new Set(initialPrograms.map((p) => p.platform))).sort()
  }, [initialPrograms])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = initialPrograms.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.platform.toLowerCase().includes(q)
      const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(p.platform)
      return matchesQuery && matchesPlatform
    })

    list = list.sort((a, b) => {
      const ad = new Date(a.last_updated).getTime()
      const bd = new Date(b.last_updated).getTime()
      return sort === "newest" ? bd - ad : ad - bd
    })

    return list
  }, [initialPrograms, query, selectedPlatforms, sort])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const togglePlatform = (name: string) => {
    setPage(1)
    setSelectedPlatforms((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  return (
    <section className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <Input
            value={query}
            onChange={(e) => {
              setPage(1)
              setQuery(e.target.value)
            }}
            placeholder="Search for bug bounty programs..."
            aria-label="Search programs"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="Sort programs"
          >
            <option value="newest">Date (Newest)</option>
            <option value="oldest">Date (Oldest)</option>
          </select>

          <label className="text-sm text-muted-foreground">Items per page</label>
          <select
            value={perPage}
            onChange={(e) => {
              setPage(1)
              setPerPage(Number(e.target.value))
            }}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="Items per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Platform Filters */}
      <div>
        <div className="mb-2 text-sm font-medium">Platforms</div>
        <div className="flex flex-wrap gap-2">
          {platforms.map((name) => {
            const active = selectedPlatforms.includes(name)
            return (
              <button
                key={name}
                onClick={() => togglePlatform(name)}
                className={[
                  "rounded-full border px-3 py-1 text-sm transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent hover:text-accent-foreground",
                ].join(" ")}
                aria-pressed={active}
              >
                {name}
              </button>
            )
          })}
          {platforms.length === 0 ? <span className="text-sm text-muted-foreground">No platform data</span> : null}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Showing {paginated.length} of {total} programs
        </span>
        {selectedPlatforms.length > 0 && (
          <div className="flex items-center gap-2">
            <span>Active filters:</span>
            {selectedPlatforms.map((p) => (
              <Badge key={p} variant="secondary" className="rounded-full">
                {p}
              </Badge>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setSelectedPlatforms([])} className="h-8 px-2">
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <ul className="space-y-3">
        {paginated.map((p) => (
          <li key={`${p.platform}-${p.name}-${p.program_url}`}>
            <ProgramCard
              name={p.name}
              program_url={p.program_url}
              logo={p.logo}
              is_new={p.is_new}
              platform={p.platform}
              reward={p.reward}
              dateLabel={formatDate(p.last_updated)}
            />
          </li>
        ))}
        {paginated.length === 0 && (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No programs match your search or filters.
          </div>
        )}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  )
}
