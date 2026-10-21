import { Link, createFileRoute } from "@tanstack/react-router";

import { clubs } from "@/lib/clubs";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MUICT Club Registration — Browse Clubs" },
      { name: "description", content: "Browse and join student clubs at MUICT." },
      { property: "og:title", content: "MUICT Club Registration" },
      { property: "og:description", content: "Browse and join student clubs at MUICT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const clubs = [
  { name: "AI", tag: "Tech", desc: "Machine learning, LLMs, and intelligent systems." },
  { name: "Dev", tag: "Tech", desc: "Build web, mobile, and open-source projects together." },
  { name: "IoT", tag: "Tech", desc: "Sensors, microcontrollers, and connected devices." },
  { name: "Cyber", tag: "Tech", desc: "Security, CTF challenges, and ethical hacking." },
  { name: "Badminton", tag: "Sports", desc: "Weekly practice and friendly tournaments." },
  { name: "Table Tennis", tag: "Sports", desc: "Fast rallies, casual games, and competitions." },
  { name: "Japanese Society", tag: "Culture", desc: "Language, anime, food, and Japanese culture." },
  { name: "Board Game", tag: "Leisure", desc: "Strategy, party, and tabletop game nights." },
  { name: "Media and Entertainment", tag: "Creative", desc: "Photo, video, and event production." },
  { name: "Speakers", tag: "Skills", desc: "Public speaking, debate, and presentation." },
];

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">MUICT</p>
          <h1 className="mt-2 text-4xl font-bold text-foreground md:text-5xl">Club Registration</h1>
          <p className="mt-3 text-muted-foreground">Explore {clubs.length} available clubs.</p>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((c) => (
          <article key={c.name} className="rounded-xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{c.tag}</span>
            <h2 className="mt-4 text-xl font-semibold text-card-foreground">{c.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
