"use client"
import Link from "next/link"
import { Github, LinkIcon, Twitter } from "lucide-react"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <img
              src="/favicon.png"
              alt="Site logo"
              width={28}
              height={28}
              className="rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            />
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-bold text-lg gradient-text">
            KrazePlanetPrograms
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <a
            href="https://github.com/KrazePlanet/KrazePlanetPrograms"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-primary/50 hover:bg-primary/10"
          >
            <Github className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          <a
            href="https://x.com/rix4uni"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-accent/50 hover:bg-accent/10"
          >
            <Twitter className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <div className="absolute inset-0 rounded-xl bg-accent/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>

          <a
            href="https://krazeplanet.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-success/50 hover:bg-success/10"
          >
            <LinkIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
            <div className="absolute inset-0 rounded-xl bg-success/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        </nav>
      </div>
    </header>
  )
}
