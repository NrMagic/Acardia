import { createFileRoute } from "@tanstack/react-router";
import { SYSTEMS } from "@/lib/archive";
import { PageTitle, SystemCard } from "@/components/arcade";

export const Route = createFileRoute("/sistemas/")({
  head: () => ({
    meta: [
      { title: "Sistemas — Arcadia" },
      { name: "description", content: "Escolha um sistema: arcade, consoles, MS-DOS e mais." },
      { property: "og:title", content: "Sistemas — Arcadia" },
      { property: "og:description", content: "Escolha um sistema: arcade, consoles, MS-DOS e mais." },
    ],
  }),
  component: Systems,
});

function Systems() {
  return (
    <>
      <PageTitle sub="Escolha uma plataforma para ver os jogos">Sistemas</PageTitle>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {SYSTEMS.map((s) => <li key={s.id}><SystemCard system={s} /></li>)}
      </ul>
    </>
  );
}
