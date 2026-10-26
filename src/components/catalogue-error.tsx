import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CatalogueError() {
  const router = useRouter();
  return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-2xl font-semibold">Could not load clubs</h1><Button className="mt-5" onClick={() => router.invalidate()}>Try again</Button></main>;
}
export function ClubNotFound() {
  return <main className="mx-auto max-w-3xl px-6 py-16"><h1 className="text-2xl font-semibold">Club not found</h1><Button asChild className="mt-5"><Link to="/" search={{ q: "", category: "all" }}>All clubs</Link></Button></main>;
}