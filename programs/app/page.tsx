import ProgramsTable from "@/components/programs-table"
import Navbar from "@/components/navbar"

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

export default async function Page() {
  // Load data on the server and pass to client component
  const response = await fetch("https://raw.githubusercontent.com/KrazePlanet/KrazePlanetPrograms/refs/heads/main/programs.json", {
    next: { revalidate: 3600 }
  })
  const programs = (await response.json()) as Program[]

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

        <ProgramsTable programs={programs} />
      </main>
    </div>
  )
}
