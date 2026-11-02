import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getItem, searchGames, SYSTEMS, type SortKey } from "@/lib/archive";
import { GameGrid, LoadingState, ErrorState, PageTitle, SearchBar, SortSelect } from "@/components/arcade";
import { useDebounced } from "@/hooks/use-debounced";

export const Route = createFileRoute("/sistemas/$id")({
  head: ({ params }) => {
    const name = SYSTEMS.find((s) => s.id === params.id)?.label ?? "Sistema";
    return {
      meta: [
        { title: `${name} — Arcadia` },
        { name: "description", content: `Jogos de ${name} para jogar online.` },
        { property: "og:title", content: `${name} — Arcadia` },
        { property: "og:description", content: `Jogos de ${name} para jogar online.` },
      ],
    };
  },
  component: SystemPage,
});

function SystemPage() {
  const { id } = Route.useParams();
  const [text, setText] = useState("");
  const [sort, setSort] = useState<SortKey>("downloads");
  const query = useDebounced(text, 400);
  const meta = useQuery({ queryKey: ["item", id], queryFn: () => getItem(id) });
  const games = useQuery({
    queryKey: ["games", id, query, sort],
    queryFn: () => searchGames({ collection: id, query, sort }),
  });
  return (
    <>
      <PageTitle sub={meta.data?.description?.slice(0, 220)}>
        {meta.data?.title ?? SYSTEMS.find((s) => s.id === id)?.label ?? id}
      </PageTitle>
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchBar value={text} onChange={setText} />
        <SortSelect value={sort} onChange={setSort} />
      </div>
      {games.isLoading ? <LoadingState /> : games.isError ? <ErrorState message={games.error.message} onRetry={() => games.refetch()} /> : <GameGrid games={games.data ?? []} />}
    </>
  );
}
