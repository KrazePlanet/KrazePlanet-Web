import { Button } from "@/components/ui/button"

type Props = {
  name: string
  program_url: string
  logo: string
  is_new?: boolean
  platform: string
  reward: string
  dateLabel: string
}

export default function ProgramCard({ name, program_url, logo, is_new, platform, reward, dateLabel }: Props) {
  return (
    <article className="group rounded-xl border bg-card px-4 py-3 transition hover:shadow-sm">
      <div className="flex items-center gap-4">
        {/* Date at start */}
        <time
          className="w-[84px] shrink-0 text-sm text-muted-foreground tabular-nums"
          title={dateLabel}
          aria-label={`Last updated ${dateLabel}`}
        >
          {dateLabel}
        </time>

        {/* Logo */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
          <img
            src={logo || "/placeholder.svg?height=40&width=40&query=program%20logo"}
            alt={`${name} logo`}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Name row: name + New + platform */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-medium">{name}</h3>

            {is_new && (
              <span
                className="inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground ring-2 ring-destructive/50 shadow-[0_0_10px_var(--color-destructive)]"
                aria-label="New program"
              >
                New
              </span>
            )}

            <span className="ml-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{platform}</span>
          </div>
        </div>

        {/* Reward + Visit */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-sm font-semibold text-success">{reward}</div>

          <Button asChild size="sm">
            <a
              href={program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1"
              aria-label={`Visit ${name} program (opens in new tab)`}
            >
              Visit
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
              </svg>
            </a>
          </Button>
        </div>
      </div>
    </article>
  )
}
