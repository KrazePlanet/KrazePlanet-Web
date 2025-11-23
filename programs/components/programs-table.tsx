"use client"

import Image from "next/image"
import Link from "next/link"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useMemo, useState, useEffect } from "react"
import { ExternalLink, Check, Search, Grid3x3, List, ChevronDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Program = {
  name: string
  program_url: string
  logo: string
  platform: string
  reward: string
  last_updated: string // ISO yyyy-mm-dd
  inscope_domains?: string[]
  outofscope_domains?: string[]
}

type Props = { programs: Program[] }

type SortOption = {
  value: string
  label: string
  key: "last_updated" | "name" | "reward"
  ascending: boolean
}

const sortOptions: SortOption[] = [
  { value: "date-newest", label: "Date (Newest)", key: "last_updated", ascending: false },
  { value: "date-oldest", label: "Date (Oldest)", key: "last_updated", ascending: true },
  { value: "name-az", label: "Name (A-Z)", key: "name", ascending: true },
  { value: "name-za", label: "Name (Z-A)", key: "name", ascending: false },
  { value: "bounty-high", label: "Max Bounty (High-Low)", key: "reward", ascending: false },
  { value: "bounty-low", label: "Max Bounty (Low-High)", key: "reward", ascending: true },
]

const PAGE_SIZE = 24

function formatDate(iso: string) {
  const d = new Date(iso)
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "2-digit" }
  return new Intl.DateTimeFormat("en-US", opts).format(d)
}

// Normalizes reward like "$200 - $5,000" => numeric max for sorting (5000)
function rewardToNumber(r: string): number {
  // Pick the higher number in a range, fallback to single number
  const nums = (r.match(/[\d,]+/g) || []).map((n) => Number.parseInt(n.replace(/,/g, ""), 10))
  if (nums.length === 0) return -1
  return Math.max(...nums)
}

// Platform data values (as they appear in programs.json)
const PLATFORM_DATA_VALUES = [
  "HackerOne",
  "Bugcrowd",
  "Intigriti",
  "YesWeHack",
  "HackenProof",
  "BugBounty Switzerland",
  "OpenBugBounty",
  "SelfHosted"
]

// Display name mapping: data value -> display name
const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  "HackerOne": "HackerOne",
  "Bugcrowd": "Bugcrowd",
  "Intigriti": "Intigriti",
  "YesWeHack": "YesWeHack",
  "HackenProof": "HackenProof",
  "BugBounty Switzerland": "BugBounty Switzerland",
  "OpenBugBounty": "OpenBugBounty",
  "SelfHosted": "SelfHosted"
}

// Get display name for a platform data value
function getPlatformDisplayName(dataValue: string): string {
  return PLATFORM_DISPLAY_NAMES[dataValue] || dataValue
}

// Get data value from display name (reverse lookup)
function getPlatformDataValue(displayName: string): string {
  const entry = Object.entries(PLATFORM_DISPLAY_NAMES).find(([_, display]) => display === displayName)
  return entry ? entry[0] : displayName
}

// All available platforms for display (using display names)
const ALL_PLATFORMS = PLATFORM_DATA_VALUES.map(getPlatformDisplayName)



export default function ProgramsTable({ programs }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [sortOption, setSortOption] = useState<string>("date-newest")
  const [query, setQuery] = useState<string>("")

  const page = Number(searchParams.get("page")) || 1

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [platformSearch, setPlatformSearch] = useState<string>("")
  const [platformPopoverOpen, setPlatformPopoverOpen] = useState<boolean>(false)
  const [today, setToday] = useState<string>("")

  useEffect(() => {
    const now = new Date()
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    setToday(formatted)
  }, [])

  // Filter platforms based on search (using display names)
  const filteredPlatforms = useMemo(() => {
    const q = platformSearch.trim().toLowerCase()
    if (!q) return ALL_PLATFORMS
    return ALL_PLATFORMS.filter((p) => p.toLowerCase().includes(q))
  }, [platformSearch])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = programs

    // Filter by search query
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }

    // Filter by selected platforms (selectedPlatforms contains data values)
    if (selectedPlatforms.length > 0) {
      result = result.filter((p) => selectedPlatforms.includes(p.platform))
    }

    return result
  }, [programs, query, selectedPlatforms])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const option = sortOptions.find((o) => o.value === sortOption)
    if (!option) return arr

    arr.sort((a, b) => {
      let av: number | string | boolean = ""
      let bv: number | string | boolean = ""

      switch (option.key) {
        case "last_updated":
          av = new Date(a.last_updated).getTime()
          bv = new Date(b.last_updated).getTime()
          break
        case "name":
          av = a.name.toLowerCase()
          bv = b.name.toLowerCase()
          break
        case "reward":
          av = rewardToNumber(a.reward)
          bv = rewardToNumber(b.reward)
          break
      }

      if (av < bv) return option.ascending ? -1 : 1
      if (av > bv) return option.ascending ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortOption])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))



  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE, total)
  const pageItems = sorted.slice(start, end)

  const currentSortLabel = sortOptions.find((o) => o.value === sortOption)?.label || "Date (Newest)"

  // Platform filter handlers
  // platform parameter is a display name, but we store data values in selectedPlatforms
  const togglePlatform = (displayName: string) => {
    const dataValue = getPlatformDataValue(displayName)
    setSelectedPlatforms((prev) =>
      prev.includes(dataValue) ? prev.filter((p) => p !== dataValue) : [...prev, dataValue]
    )
    updatePage(1)
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="glass rounded-2xl border-border/50 px-6 py-4 backdrop-blur-xl relative z-30">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                updatePage(1)
              }}
              placeholder="Search for bug bounty programs..."
              aria-label="Search programs by name"
              className="pl-10 h-11 bg-background/50 border-border/50 rounded-xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Platform Filter */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setPlatformPopoverOpen(!platformPopoverOpen)}
                className="h-11 bg-background/50 border-border/50 rounded-xl hover:border-primary/50 transition-all duration-300 gap-2"
              >
                <Filter className="h-4 w-4" />
                <span>Platforms</span>
                {selectedPlatforms.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    {selectedPlatforms.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>

              {platformPopoverOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 p-0 border border-border/50 rounded-md shadow-lg z-50 bg-card/95 backdrop-blur-sm">
                  <div className="flex flex-col">
                    {/* Search platforms */}
                    <div className="p-3 border-b border-border/30">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={platformSearch}
                          onChange={(e) => setPlatformSearch(e.target.value)}
                          placeholder="Search platforms"
                          className="h-9 pl-8 bg-background/50 border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    {/* Platform list */}
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      {/* Individual platforms */}
                      {filteredPlatforms.map((displayName) => {
                        const dataValue = getPlatformDataValue(displayName)
                        return (
                          <label
                            key={displayName}
                            className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent/50 cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={selectedPlatforms.includes(dataValue)}
                              onCheckedChange={() => togglePlatform(displayName)}
                              className="border-border/50"
                            />
                            <span className="text-sm text-white font-medium">{displayName}</span>
                          </label>
                        )
                      })}

                      {filteredPlatforms.length === 0 && (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No platforms found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-[200px] h-11 bg-background/50 border-border/50 rounded-xl hover:border-primary/50 transition-all duration-300">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="glass border-border/50">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-primary/10">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-background/50 border border-border/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-300 ${viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-300 ${viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 text-sm font-medium text-muted-foreground">
          Showing <span className="text-primary font-bold">{total === 0 ? 0 : start + 1}-{end}</span> of{" "}
          <span className="text-primary font-bold">{total}</span>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((p, idx) => (
            <div
              key={p.program_url}
              className="glass rounded-2xl border-border/50 p-6 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <time dateTime={p.last_updated} className="text-xs text-muted-foreground font-medium">
                  {formatDate(p.last_updated)}
                </time>
                {p.last_updated === today && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-1 text-success font-bold text-xs border border-success/30 pulse-success">
                    New
                  </span>
                )}
              </div>

              {/* Logo & Name */}
              <div className="flex items-center gap-3 mb-4">
                <span className="relative block h-12 w-12 overflow-hidden rounded-xl ring-2 ring-border/30 group-hover:ring-primary/50 transition-all duration-300 flex-shrink-0">
                  <Image
                    src={p.logo || "/placeholder.svg?height=48&width=48&query=company%20logo"}
                    alt={`${p.name} logo`}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </span>
                <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors duration-300">
                  {p.name}
                </h3>
              </div>

              {/* Platform */}
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-semibold backdrop-blur-sm group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
                  {getPlatformDisplayName(p.platform)}
                </span>
              </div>

              {/* Reward */}
              <div className="mb-6">
                <div className="text-xs text-muted-foreground mb-1">Reward Range</div>
                <div className="text-2xl font-bold text-success">{p.reward}</div>
              </div>

              {/* Visit Button */}
              <Button asChild className="w-full btn-gradient text-white font-semibold shadow-lg hover:shadow-xl">
                <Link href={p.program_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.name}`}>
                  <span className="mr-1.5">Visit Program</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          ))}

          {pageItems.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="text-5xl opacity-20">🔍</div>
                <p className="text-lg font-semibold text-muted-foreground">No programs found.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View (Table) */}
      {viewMode === "list" && (
        <div className="glass rounded-2xl border-border/50 text-card-foreground shadow-2xl">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 glass backdrop-blur-xl">
                <tr>
                  <th scope="col" className="w-[180px] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    DATE
                  </th>
                  <th scope="col" className="min-w-[250px] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    NAME
                  </th>
                  <th scope="col" className="w-[180px] px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    NEW
                  </th>
                  <th scope="col" className="w-[180px] px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    PLATFORM
                  </th>
                  <th scope="col" className="w-[220px] px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    REWARD
                  </th>
                  <th scope="col" className="w-[120px] px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    LINK
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p, idx) => (
                  <tr
                    key={p.program_url}
                    className="group hover:bg-primary/5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* DATE */}
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <time dateTime={p.last_updated} className="text-foreground font-medium">
                        {formatDate(p.last_updated)}
                      </time>
                    </td>

                    {/* NAME + LOGO inline */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="relative block h-8 w-8 overflow-hidden rounded-lg ring-2 ring-border/30 group-hover:ring-primary/50 transition-all duration-300 group-hover:scale-110">
                          <Image
                            src={p.logo || "/placeholder.svg?height=32&width=32&query=company%20logo"}
                            alt={`${p.name} logo`}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        </span>
                        <span className="font-semibold text-foreground text-pretty group-hover:text-primary transition-colors duration-300">
                          {p.name}
                        </span>
                      </div>
                    </td>

                    {/* NEW */}
                    <td className="px-6 py-4 text-center">
                      {p.last_updated === today ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-success font-bold text-xs border border-success/30 pulse-success">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>New</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* PLATFORM */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-semibold backdrop-blur-sm group-hover:border-primary/50 group-hover:bg-primary/10 transition-all duration-300">
                        {getPlatformDisplayName(p.platform)}
                      </span>
                    </td>

                    {/* REWARD */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-success text-base">{p.reward}</span>
                    </td>

                    {/* LINK */}
                    <td className="px-6 py-4 text-right">
                      <Button asChild className="btn-gradient text-white font-semibold shadow-lg hover:shadow-xl">
                        <Link href={p.program_url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${p.name}`}>
                          <span className="mr-1.5">Visit</span>
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-5xl opacity-20">🔍</div>
                        <p className="text-lg font-semibold text-muted-foreground">No programs found.</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="glass rounded-2xl border-border/50 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-muted-foreground">
            Page <span className="text-primary font-bold">{currentPage}</span> of{" "}
            <span className="text-primary font-bold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="rounded-xl border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/50 disabled:opacity-40 transition-all duration-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-xl border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/50 disabled:opacity-40 transition-all duration-300"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
