import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { embedUrl, getItem } from "@/lib/archive";

export const Route = createFileRoute("/jogar/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Jogando ${params.id} — Arcadia` },
      { name: "description", content: "Jogue em tempo real no navegador." },
      { property: "og:title", content: `Jogando ${params.id} — Arcadia` },
      { property: "og:description", content: "Jogue em tempo real no navegador." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["item", id], queryFn: () => getItem(id) });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link to="/jogo/$id" params={{ id }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="truncate font-display text-xs text-primary text-glow">{q.data?.title ?? id}</h1>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-xl border-4 border-accent bg-card shadow-neon-accent">
        <iframe src={embedUrl(id)} title={q.data?.title ?? id} className="h-full w-full" allowFullScreen />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Clique no botão de play do emulador. Teclas comuns: 5 = moeda, 1 = start, setas = mover, Ctrl/Alt = botões.
      </p>
    </div>
  );
}
