import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { searchGames } from "@/lib/archive";
import { GameGrid, LoadingState, ErrorState, PageTitle } from "@/components/arcade";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arcadia — Jogue clássicos arcade online" },
      { name: "description", content: "Os jogos arcade mais jogados, direto no navegador." },
      { property: "og:title", content: "Arcadia — Jogue clássicos arcade online" },
      { property: "og:description", content: "Os jogos arcade mais jogados, direto no navegador." },
    ],
  }),
  component: Home,
});

function Home() {
  const q = useQuery({
    queryKey: ["top-arcade"],
    queryFn: () => searchGames({ collection: "internetarcade", rows: 12 }),
  });
  return (
    <div className="space-y-10">
      <section className="scanlines rounded-xl border-2 border-primary bg-card p-8 text-center shadow-neon md:p-14">
        <p className="font-display text-xs text-accent blink">INSERT COIN</p>
        <h1 className="mt-4 font-display text-2xl leading-relaxed text-primary text-glow md:text-4xl">ARCADIA</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Milhares de clássicos de arcade e consoles para jogar agora, sem instalar nada.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/sistemas" className="rounded-md bg-primary px-4 py-3 font-display text-xs text-primary-foreground shadow-neon">Ver sistemas</Link>
          <Link to="/busca" className="rounded-md border-2 border-accent px-4 py-3 font-display text-xs text-accent">Buscar</Link>
        </div>
      </section>
      <section>
        <PageTitle sub="Os mais jogados do Internet Arcade">Top arcade</PageTitle>
        {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => q.refetch()} /> : <GameGrid games={q.data ?? []} />}
      </section>
    </div>
  );
}
