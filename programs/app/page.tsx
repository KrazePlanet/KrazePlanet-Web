import ProgramsTable from "@/components/programs-table"
import { Suspense } from "react"
import Navbar from "@/components/navbar"

import programsData from "../programs.json"



// Force dynamic rendering to ensure searchParams are available on the server
// Keep types local to the server component for simplicity
type Program = {
  name: string
  program_url: string
  logo: string
  platform: string
  reward: string
  last_updated: string // YYYY-MM-DD
  inscope_domains?: string[]
  outofscope_domains?: string[]
  is_new?: boolean
}

export default function Page() {
  // Use local data
  const programs = programsData as Program[]

  return (
    <div className="orb-bg min-h-screen">
      {/* Render navbar */}
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-bold tracking-tight gradient-text mb-4 animate-fade-in">
            SelfHosted - Bug Bounty Programs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Discover new and fresh bug bounty programs across platforms. Updated frequently to always display the newest
            public programs.
          </p>
        </header>

        <Suspense fallback={<div>Loading...</div>}>
          <ProgramsTable programs={programs} />
        </Suspense>
      </main>
    </div>
  )
}
