import { radioPodcastApi } from "@/core/api/radioPodcastApi";

export interface RadioNowPlaying {
  title: string | null;
  artist: string | null;
  artworkUrl: string | null;
  rawTitle: string | null;
  trackId: string | null;
  updatedAt: string;
  metadataStatus: "available" | "unavailable" | "stale" | "upstream_error" | "missing_radioid";
}

export async function getNowPlaying(term: string, signal: AbortSignal): Promise<RadioNowPlaying> {
  const { data } = await radioPodcastApi.get<RadioNowPlaying>(
    `/radio-station/${encodeURIComponent(term)}/now-playing`,
    { signal },
  );
  return data;
}
