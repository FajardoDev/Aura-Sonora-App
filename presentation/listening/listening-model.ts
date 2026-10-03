export interface RadioListen {
  kind: "radio";
  radioId: string;
  slug: string;
  title: string;
  artwork: string;
  stream: string;
  radioid: string;
  categories: string[];
  locations: string[];
  format?: string;
}

export interface EpisodeListen {
  kind: "podcast";
  podcastId: string;
  podcastSlug: string;
  podcastTitle: string;
  episodeId: string;
  episodeSlug: string;
  remoteStream?: string;
  title: string;
  artwork: string;
  stream: string;
  categories: string[];
}

export type ListeningSource = RadioListen | EpisodeListen;
export type RecentRadio = RadioListen & { playedAt: number };
export type RecentEpisode = EpisodeListen & {
  position: number;
  duration: number;
  playedAt: number;
  updatedAt: number;
  completed: boolean;
};
export interface ListeningProfile {
  radios: RecentRadio[];
  episodes: RecentEpisode[];
  updatedAt: number;
}
export const EMPTY_PROFILE: ListeningProfile = { radios: [], episodes: [], updatedAt: 0 };
export const scopeForUser = (userId?: string) => userId ? `user:${userId}` : "guest";
export const isEpisodeComplete = (position: number, duration: number) =>
  duration > 0 && (position / duration >= 0.95 || (duration > 120 && duration - position <= 60));

export function upsertRadio(profile: ListeningProfile, source: RadioListen, now: number): ListeningProfile {
  return { ...profile, updatedAt: now, radios: [
    { ...source, playedAt: now },
    ...profile.radios.filter(r => r.radioId !== source.radioId && r.slug !== source.slug),
  ].slice(0, 20) };
}

export function upsertEpisode(profile: ListeningProfile, source: EpisodeListen, position: number, duration: number, now: number, newListen: boolean): ListeningProfile {
  const previous = profile.episodes.find(e => e.episodeId === source.episodeId);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : previous?.duration || 0;
  const safePosition = Math.max(0, Math.min(Number.isFinite(position) ? position : 0, safeDuration || Infinity));
  const episode = { ...source, position: safePosition, duration: safeDuration,
    completed: isEpisodeComplete(safePosition, safeDuration),
    playedAt: newListen ? now : previous?.playedAt || now, updatedAt: now };
  return { ...profile, updatedAt: now, episodes: [episode,
    ...profile.episodes.filter(e => e.episodeId !== source.episodeId),
  ].sort((a, b) => b.playedAt - a.playedAt).slice(0, 30) };
}

export interface PlaybackSample {
  loaded: boolean;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
}

// Runs on native playback samples, not Play taps. Large seek/time jumps do not
// qualify as listened time. Buffering, pauses and disconnected periods do not count.
export class ListeningSession {
  private previous?: PlaybackSample & { now: number };
  private audibleSeconds = 0;
  private lastWrite = 0;
  private registered = false;
  private lastSavedPosition = -1;
  private lastSavedDuration = -1;
  private lastCompleted = false;
  constructor(public readonly source: ListeningSource,
    private readonly write: (position: number, duration: number, now: number, first: boolean) => void) {}

  sample(sample: PlaybackSample, now: number) {
    const prev = this.previous;
    const active = sample.loaded && sample.playing && !sample.buffering;
    if (active && prev?.loaded && prev.playing && !prev.buffering) {
      const elapsed = (now - prev.now) / 1000;
      const progress = sample.position - prev.position;
      if (elapsed > 0 && elapsed <= 2.5 && (this.source.kind === "radio" || (progress > 0 && progress <= elapsed + 1))) {
        this.audibleSeconds += this.source.kind === "radio" ? elapsed : Math.min(elapsed, progress);
      }
    }
    this.previous = { ...sample, now };
    if (prev?.playing && !sample.playing && !sample.buffering) {
      this.flush(now);
      this.audibleSeconds = 0; this.registered = false; this.lastCompleted = false;
      return;
    }
    const qualifies = this.audibleSeconds >= (this.source.kind === "radio" ? 15 : 5);
    if (!qualifies) return;
    if (!this.registered || (this.source.kind === "podcast" &&
      (now - this.lastWrite >= 10000 || !active || (isEpisodeComplete(sample.position, sample.duration) && !this.lastCompleted)))) this.flush(now);
  }

  flush(now: number) {
    const sample = this.previous;
    if (!sample || this.audibleSeconds < (this.source.kind === "radio" ? 15 : 5)) return;
    if (this.source.kind === "radio" && this.registered) return;
    if (this.source.kind === "podcast" && this.registered &&
      Math.abs(sample.position - this.lastSavedPosition) < 1 && sample.duration === this.lastSavedDuration) return;
    this.write(sample.position, sample.duration, now, !this.registered);
    this.registered = true;
    this.lastWrite = now;
    this.lastSavedPosition = sample.position;
    this.lastSavedDuration = sample.duration;
    this.lastCompleted = isEpisodeComplete(sample.position, sample.duration);
  }
}

interface RecommendationItem { id: string; slug: string; categories?: string[]; locations?: string[]; streamtype?: string }
export function rankRelated<T extends RecommendationItem>(seed: RecommendationItem, candidates: T[], trustedIds: Set<string> = new Set()): T[] {
  const normalize = (values?: string[]) => new Set((values || []).filter(v => typeof v === "string").map(v => v.toLocaleLowerCase().trim()));
  const categories = normalize(seed.categories);
  const locations = normalize(seed.locations);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  return candidates.filter(item => {
    if (item.id === seed.id || item.slug === seed.slug || ids.has(item.id) || slugs.has(item.slug)) return false;
    ids.add(item.id); slugs.add(item.slug); return true;
  }).map(item => ({ item, score:
    [...normalize(item.categories)].filter(c => categories.has(c)).length * 100 +
    [...normalize(item.locations)].filter(l => locations.has(l)).length * 10 +
    (seed.streamtype && seed.streamtype === item.streamtype ? 1 : 0) +
    (trustedIds.has(item.id) ? 1 : 0),
  })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(({ item }) => item);
}

// Radio recommendations are musical matches. Geography never creates a match.
export function rankRelatedRadios<T extends RecommendationItem>(seed: RecommendationItem, candidates: T[], popularRanks: Map<string, number> = new Map()): T[] {
  const normalize = (values?: string[]) => new Set((values || []).filter(v => typeof v === "string")
    .map(v => v.trim().toLocaleLowerCase()).filter(Boolean));
  const genres = normalize(seed.categories);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  return candidates.filter(item => {
    if (item.id === seed.id || item.slug === seed.slug || ids.has(item.id) || slugs.has(item.slug)) return false;
    ids.add(item.id); slugs.add(item.slug); return true;
  }).map(item => ({ item, matches: [...normalize(item.categories)].filter(c => genres.has(c)).length,
    rank: popularRanks.get(item.slug) ?? Number.POSITIVE_INFINITY,
  })).filter(({ matches }) => matches > 0)
    .sort((a, b) => b.matches - a.matches || a.rank - b.rank).slice(0, 5).map(({ item }) => item);
}
