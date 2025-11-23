import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"

export default function NotFound() {
    return (
        <div className="orb-bg min-h-screen">
            <Navbar />
            <main className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
                <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
                <h2 className="text-3xl font-bold mb-6 text-foreground">Page Not Found</h2>
                <p className="text-lg text-muted-foreground max-w-md mb-8">
                    No results found in this page. The page you are looking for doesn't exist.
                </p>
                <Button asChild className="btn-gradient text-white font-semibold shadow-lg hover:shadow-xl">
                    <Link href="/?page=1">
                        Go back to Page 1
                    </Link>
                </Button>
            </main>
        </div>
    )
}
