import { Link } from "@tanstack/react-router";
import { Gamepad2, Loader2, AlertTriangle, Ghost, Search, Download } from "lucide-react";
import type { Game, System } from "@/lib/archive";
import { thumb } from "@/lib/archive";

export function Header() {
  const link = "px-3 py-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors";
  const active = { className: "text-primary text-glow" };
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-sm text-primary text-glow">
          <Gamepad2 className="h-6 w-6" /> ARCADIA
        </Link>
        <nav className="flex flex-wrap">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>Início</Link>
          <Link to="/sistemas" className={link} activeProps={active}>Sistemas</Link>
          <Link to="/busca" className={link} activeProps={active}>Buscar</Link>
          <Link to="/sobre" className={link} activeProps={active}>Sobre</Link>
        </nav>
      </div>
    </header>
  );
}

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      to="/jogo/$id"
      params={{ id: game.identifier }}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition hover:-translate-y-1 hover:border-primary hover:shadow-neon"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={thumb(game.identifier)}
          alt={game.title}
          loading="lazy"
          className="h-full w-full object-cover pixelated transition group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-card-foreground">{game.title}</h3>
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>{game.year ?? "—"}</span>
          {game.downloads != null && (
            <span className="flex items-center gap-1"><Download className="h-3 w-3" />{game.downloads.toLocaleString("pt-BR")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function GameGrid({ games }: { games: Game[] }) {
  if (games.length === 0) return <EmptyState />;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {games.map((g) => (
        <li key={g.identifier}><GameCard game={g} /></li>
      ))}
    </ul>
  );
}

export function SystemCard({ system }: { system: System }) {
  return (
    <Link
      to="/sistemas/$id"
      params={{ id: system.id }}
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 text-center transition hover:border-accent hover:shadow-neon-accent"
    >
      <span className="text-4xl">{system.emoji}</span>
      <span className="font-display text-xs text-accent">{system.label}</span>
    </Link>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string | undefined }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-lg leading-relaxed text-primary text-glow md:text-2xl">{children}</h1>
      {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-primary">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="font-display text-xs blink">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: (() => void) | undefined }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-destructive">
      <AlertTriangle className="h-8 w-8" />
      <span className="font-display text-xs">GAME OVER</span>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && <ArcadeButton onClick={onRetry}>Tentar de novo</ArcadeButton>}
    </div>
  );
}

export function EmptyState({ text = "Nenhum jogo encontrado." }: { text?: string | undefined }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
      <Ghost className="h-8 w-8" />
      <p>{text}</p>
    </div>
  );
}

export function ArcadeButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-md border-2 border-primary bg-primary px-4 py-2 font-display text-xs text-primary-foreground shadow-neon transition hover:brightness-110 ${props.className ?? ""}`}
    />
  );
}

export function SearchBar({ value, onChange, placeholder = "Buscar jogo..." }: { value: string; onChange: (v: string) => void; placeholder?: string | undefined }) {
  return (
    <label className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 focus-within:border-primary">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

export function SortSelect({ value, onChange }: { value: string; onChange: (v: "downloads" | "title" | "year") => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "downloads" | "title" | "year")}
      className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
    >
      <option value="downloads">Mais jogados</option>
      <option value="title">Nome (A-Z)</option>
      <option value="year">Mais recentes</option>
    </select>
  );
}
