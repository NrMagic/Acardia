import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { getItem, thumb, SYSTEMS } from "@/lib/archive";
import { LoadingState, ErrorState } from "@/components/arcade";

export const Route = createFileRoute("/jogo/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} — Arcadia` },
      { name: "description", content: "Detalhes do jogo e botão para jogar online." },
      { property: "og:title", content: `${params.id} — Arcadia` },
      { property: "og:description", content: "Detalhes do jogo e botão para jogar online." },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["item", id], queryFn: () => getItem(id) });
  if (q.isLoading) return <LoadingState />;
  if (q.isError) return <ErrorState message={q.error.message} onRetry={() => q.refetch()} />;
  const g = q.data!;
  const system = SYSTEMS.find((s) => g.collection?.includes(s.id));
  return (
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <img src={thumb(id)} alt={g.title} className="w-full rounded-lg border-2 border-accent pixelated shadow-neon-accent" />
      <div className="space-y-4">
        {system && (
          <Link to="/sistemas/$id" params={{ id: system.id }} className="text-sm text-accent">
            {system.emoji} {system.label}
          </Link>
        )}
        <h1 className="font-display text-lg leading-relaxed text-primary text-glow md:text-2xl">{g.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {g.year && <span>Ano: {g.year}</span>}
          {g.creator && <span>Criador: {g.creator}</span>}
        </div>
        {g.subject && g.subject.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {g.subject.map((s) => <span key={s} className="rounded bg-muted px-2 py-1 text-xs">{s}</span>)}
          </div>
        )}
        <p className="leading-relaxed text-foreground/85">{g.description || "Sem descrição disponível."}</p>
        <Link to="/jogar/$id" params={{ id }} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-display text-xs text-primary-foreground shadow-neon">
          <Play className="h-4 w-4" /> JOGAR AGORA
        </Link>
      </div>
    </div>
  );
}
