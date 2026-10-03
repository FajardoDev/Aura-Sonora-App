import type { ListeningProfile } from "./listening-model";

export interface HistorySyncMark { playedAt: number; ownerId: string; syncedAt?: number }
export type HistorySyncMarks = Record<string, HistorySyncMark>;
export interface HistorySyncPayload {
  radios: { radioId: string; playedAt: string }[];
  podcasts: { podcastId: string; playedAt: string }[];
}
export interface HistorySyncResult { success: boolean; radios: string[]; podcasts: string[] }
export interface SyncReference { key: string; playedAt: number; id: string; type: "radio" | "podcast" }
export interface SyncPlan { payload: HistorySyncPayload; references: SyncReference[] }
interface CatalogIdentity { id: string; slug: string; radioid?: string }
export const internalUuid = (id?: string): id is string => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

export function guestRevisions(profile: ListeningProfile) {
  return new Map<string, number>([
    ...profile.radios.map(r => [`radio:${r.radioId}`, r.playedAt] as const),
    ...profile.episodes.map(e => [`episode:${e.episodeId}`, e.playedAt] as const),
  ]);
}

export function buildGuestHistorySync(profile: ListeningProfile, marks: HistorySyncMarks, ownerId: string,
  catalog: { radios: CatalogIdentity[]; podcasts: CatalogIdentity[] }): SyncPlan {
  const references: SyncReference[] = [];
  const radios = new Map<string, number>();
  const podcasts = new Map<string, number>();
  const pending = (key: string, playedAt: number) => {
    if (!Number.isFinite(playedAt) || playedAt <= 0 || playedAt > Date.now() + 300000) return false;
    const mark = marks[key];
    return !mark || mark.playedAt !== playedAt || (mark.ownerId === ownerId && !mark.syncedAt);
  };
  for (const radio of profile.radios) {
    const key = `radio:${radio.radioId}`;
    if (!pending(key, radio.playedAt)) continue;
    const id = internalUuid(radio.radioId) ? radio.radioId : catalog.radios.find(r =>
      r.slug === radio.slug || (radio.radioid && r.radioid === radio.radioid) || r.radioid === radio.radioId)?.id;
    if (!internalUuid(id)) continue;
    const canonical = id.toLowerCase();
    if (!radios.has(canonical) && radios.size >= 20) continue;
    radios.set(canonical, Math.max(radios.get(canonical) || 0, radio.playedAt));
    references.push({ key, playedAt: radio.playedAt, id: canonical, type: "radio" });
  }
  for (const episode of [...profile.episodes].sort((a, b) => b.playedAt - a.playedAt)) {
    const key = `episode:${episode.episodeId}`;
    if (!pending(key, episode.playedAt)) continue;
    const id = internalUuid(episode.podcastId) ? episode.podcastId : catalog.podcasts.find(p => p.slug === episode.podcastSlug)?.id;
    if (!internalUuid(id)) continue;
    const canonical = id.toLowerCase();
    if (!podcasts.has(canonical) && podcasts.size >= 20) continue;
    podcasts.set(canonical, Math.max(podcasts.get(canonical) || 0, episode.playedAt));
    references.push({ key, playedAt: episode.playedAt, id: canonical, type: "podcast" });
  }
  return { references, payload: {
    radios: [...radios].map(([radioId, playedAt]) => ({ radioId, playedAt: new Date(playedAt).toISOString() })),
    podcasts: [...podcasts].map(([podcastId, playedAt]) => ({ podcastId, playedAt: new Date(playedAt).toISOString() })),
  } };
}

// Compare individual revisions: a late response cannot acknowledge a newer listen.
export function updateSyncMarks(profile: ListeningProfile, previous: HistorySyncMarks, ownerId: string,
  plan: SyncPlan, result?: HistorySyncResult): HistorySyncMarks {
  const revisions = guestRevisions(profile);
  const marks = Object.fromEntries(Object.entries(previous).filter(([key, mark]) => revisions.get(key) === mark.playedAt));
  const radios = new Set(result?.radios);
  const podcasts = new Set(result?.podcasts);
  for (const ref of plan.references) {
    if (revisions.get(ref.key) !== ref.playedAt) continue;
    const prior = marks[ref.key];
    if (prior && prior.ownerId !== ownerId) continue;
    if (result && (!result.success || !(ref.type === "radio" ? radios : podcasts).has(ref.id))) continue;
    marks[ref.key] = { playedAt: ref.playedAt, ownerId, ...(result ? { syncedAt: Date.now() } : {}) };
  }
  return marks;
}
