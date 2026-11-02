import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchGames, SYSTEMS, type SortKey } from "@/lib/archive";
import { GameGrid, LoadingState, ErrorState, PageTitle, SearchBar, SortSelect, EmptyState } from "@/components/arcade";
import { useDebounced } from "@/hooks/use-debounced";

export const Route = createFileRoute("/busca")({
  head: () => ({
    meta: [
      { title: "Buscar jogos — Arcadia" },
      { name: "description", content: "Pesquise jogos clássicos em todos os sistemas." },
      { property: "og:title", content: "Buscar jogos — Arcadia" },
      { property: "og:description", content: "Pesquise jogos clássicos em todos os sistemas." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [text, setText] = useState("");
  const [system, setSystem] = useState("");
  const [sort, setSort] = useState<SortKey>("downloads");
  const query = useDebounced(text, 400);
  const enabled = query.trim().length >= 2;
  const q = useQuery({
    queryKey: ["search", query, system, sort],
    queryFn: () => searchGames({ query, collection: system || undefined, sort }),
    enabled,
  });
  return (
    <>
      <PageTitle sub="Procure em todos os sistemas">Buscar</PageTitle>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBar value={text} onChange={setText} placeholder="Ex.: pac-man, street fighter..." />
        <SortSelect value={sort} onChange={setSort} />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {[{ id: "", label: "Todos" }, ...SYSTEMS].map((s) => (
          <button
            key={s.id}
            onClick={() => setSystem(s.id)}
            className={`rounded-full border px-3 py-1 text-sm ${system === s.id ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-accent"}`}
          >{s.label}</button>
        ))}
      </div>
      {!enabled ? <EmptyState text="Digite pelo menos 2 letras para buscar." /> :
        q.isLoading ? <LoadingState /> : q.isError ? <ErrorState message={q.error.message} onRetry={() => q.refetch()} /> : <GameGrid games={q.data ?? []} />}
    </>
  );
}
