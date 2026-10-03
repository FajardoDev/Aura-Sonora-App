import type { QueryClient } from "@tanstack/react-query";
import type { Podcasts, Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";

// Only walk catalog containers, never comments, user objects or arbitrary graphs.
export function cachedCatalog(client: QueryClient) {
  const radios: Station[] = [];
  const podcasts: Podcasts[] = [];
  const visited = new Set<unknown>();
  let count = 0;
  function visit(value: unknown, depth: number) {
    if (!value || typeof value !== "object" || depth > 5 || count >= 600 || visited.has(value)) return;
    visited.add(value); count++;
    if (Array.isArray(value)) { value.slice(0, 100).forEach(item => visit(item, depth + 1)); return; }
    const item = value as Record<string, unknown>;
    if (typeof item.id === "string" && typeof item.slug === "string") {
      if (typeof item.radioname === "string") radios.push(item as unknown as Station);
      else if (typeof item.titleEncabezado === "string") podcasts.push(item as unknown as Podcasts);
    }
    for (const key of ["pages", "data", "stations", "podcast", "radios", "podcasts", "items", "radioStation", "relatedStations", "relatedPodcast"]) visit(item[key], depth + 1);
  }
  client.getQueryCache().getAll().forEach(query => visit(query.state.data, 0));
  return { radios, podcasts };
}
