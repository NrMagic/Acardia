// Cliente da API pública do Internet Archive (https://archive.org/developers)
export type Game = {
  identifier: string;
  title: string;
  year?: string | undefined;
  downloads?: number | undefined;
  creator?: string | undefined;
};

export type System = { id: string; label: string; emoji: string };

// IDs das coleções; nomes e descrições vêm da API de metadados
export const SYSTEMS: System[] = [
  { id: "internetarcade", label: "Arcade", emoji: "🕹️" },
  { id: "consolelivingroom", label: "Consoles", emoji: "📺" },
  { id: "softwarelibrary_msdos_games", label: "MS-DOS", emoji: "💾" },
  { id: "softwarelibrary_c64_games", label: "Commodore 64", emoji: "🖥️" },
  { id: "softwarelibrary_zx_spectrum", label: "ZX Spectrum", emoji: "🌈" },
  { id: "softwarelibrary_apple", label: "Apple II", emoji: "🍏" },
];

export type SortKey = "downloads" | "title" | "year";

const SORT_MAP: Record<SortKey, string> = {
  downloads: "downloads desc",
  title: "titleSorter asc",
  year: "year desc",
};

export const thumb = (id: string) => `https://archive.org/services/img/${id}`;
export const embedUrl = (id: string) => `https://archive.org/embed/${id}`;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ${res.status} ao acessar o Internet Archive`);
  return (await res.json()) as T;
}

export async function searchGames(opts: {
  collection?: string | undefined;
  query?: string | undefined;
  sort?: SortKey | undefined;
  rows?: number | undefined;
}): Promise<Game[]> {
  const parts: string[] = [];
  parts.push(
    opts.collection
      ? `collection:${opts.collection}`
      : `(${SYSTEMS.map((s) => `collection:${s.id}`).join(" OR ")})`,
  );
  parts.push("mediatype:software");
  if (opts.query?.trim()) parts.push(`title:(${opts.query.trim().replace(/[():"]/g, " ")})`);
  const p = new URLSearchParams({
    q: parts.join(" AND "),
    rows: String(opts.rows ?? 48),
    page: "1",
    output: "json",
  });
  ["identifier", "title", "year", "downloads", "creator"].forEach((f) => p.append("fl[]", f));
  p.append("sort[]", SORT_MAP[opts.sort ?? "downloads"]);
  const data = await getJson<{ response: { docs: Game[] } }>(
    `https://archive.org/advancedsearch.php?${p}`,
  );
  return data.response.docs.map((d) => ({
    ...d,
    title: Array.isArray(d.title) ? d.title[0] : d.title,
    creator: Array.isArray(d.creator) ? d.creator[0] : d.creator,
  }));
}

export type ItemMeta = {
  identifier: string;
  title: string;
  description?: string | undefined;
  year?: string | undefined;
  creator?: string | undefined;
  subject?: string[] | undefined;
  collection?: string[] | undefined;
};

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
const list = (v: unknown) => (v == null ? [] : Array.isArray(v) ? v : [v]) as string[];
const stripHtml = (s?: string) => s?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function getItem(id: string): Promise<ItemMeta> {
  const data = await getJson<{ metadata?: Record<string, unknown> }>(
    `https://archive.org/metadata/${id}`,
  );
  if (!data.metadata) throw new Error("Item não encontrado");
  const m = data.metadata;
  return {
    identifier: id,
    title: first(m["title"]) ?? id,
    description: stripHtml(first(m["description"])),
    year: first(m["year"]) ?? first(m["date"]),
    creator: first(m["creator"]),
    subject: list(m["subject"]).flatMap((s) => s.split(";")).map((s) => s.trim()).filter(Boolean).slice(0, 8),
    collection: list(m["collection"]),
  };
}
