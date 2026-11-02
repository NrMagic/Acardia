import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/arcade";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Arcadia" },
      { name: "description", content: "Como o Arcadia funciona e de onde vêm os jogos." },
      { property: "og:title", content: "Sobre — Arcadia" },
      { property: "og:description", content: "Como o Arcadia funciona e de onde vêm os jogos." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="max-w-2xl space-y-4 leading-relaxed">
      <PageTitle>Sobre</PageTitle>
      <p>O Arcadia reúne jogos clássicos preservados pelo <a className="text-accent underline" href="https://archive.org/details/internetarcade" target="_blank" rel="noreferrer">Internet Archive</a>.</p>
      <p>Os sistemas, listas, detalhes e o emulador vêm em tempo real das APIs públicas de busca e de metadados do Archive.</p>
      <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
        <li>Busca: archive.org/advancedsearch.php</li>
        <li>Detalhes: archive.org/metadata/&#123;id&#125;</li>
        <li>Capas: archive.org/services/img/&#123;id&#125;</li>
        <li>Emulador: archive.org/embed/&#123;id&#125;</li>
      </ul>
    </div>
  );
}
