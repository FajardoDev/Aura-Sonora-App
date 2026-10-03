import type { Station, Podcasts } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { FlatHistoryEntity, useHistory } from "@/core/radio-podcast/actions/radio-podcast/hooks/useHistory";
import { fetchRadioStationsBySlug } from "@/core/radio-podcast/actions/radio/get-radio-by-slug.action";
import { fetchPodcastById } from "@/core/radio-podcast/actions/podcast/fetch-podcastBy-id";
import { useTopStation } from "@/presentation/radio/hooks/useTopStation";
import { useTopPodcast } from "@/presentation/podcast/hooks/useTopPodcast";
import { cachedCatalog } from "./catalog-cache";
import { EMPTY_PROFILE, rankRelated, rankRelatedRadios, RecentEpisode, RecentRadio, scopeForUser } from "./listening-model";
import { useListeningStore } from "./useListeningStore";

export interface RecentlyPlayed {
  key: string;
  title: string;
  artwork?: string;
  playedAt: number;
  radio?: RecentRadio & Partial<Pick<Station, "commentsCount" | "averageRating">>;
  episode?: RecentEpisode;
  podcast?: Podcasts;
  backend?: FlatHistoryEntity;
}

export function useHomeListening() {
  const authenticated = useAuthStore(state => state.status === "authenticated");
  const userId = useAuthStore(state => state.user?.id);
  const scope = scopeForUser(authenticated ? userId : undefined);
  const profile = useListeningStore(state => state.profiles[scope] || EMPTY_PROFILE);
  const { historyQuery, radios, podcasts, isLoading, isError } = useHistory();
  const client = useQueryClient();
  const { topStationQuery } = useTopStation();
  const { topPodcastQuery } = useTopPodcast();

  useFocusEffect(useCallback(() => {
    if (authenticated) void historyQuery.refetch();
  }, [authenticated, historyQuery.refetch]));

  const continuing = useMemo(() => profile.episodes.filter(e => !e.completed && e.position > 0).slice(0, 10), [profile.episodes]);
  const recentlyPlayed = useMemo<RecentlyPlayed[]>(() => {
    if (authenticated) return [...radios, ...podcasts].map(item => ({ key: `${item.type}:${item.id}`,
      title: item.title, artwork: item.image, playedAt: new Date(item.lastPlayed).getTime(), backend: item,
    })).sort((a, b) => b.playedAt - a.playedAt);
    // A continuing episode has its own progress card; avoid showing it twice.
    return [
      ...profile.radios.map(r => ({ key: `radio:${r.radioId}`, title: r.title, artwork: r.artwork, playedAt: r.playedAt, radio: r })),
      ...profile.episodes.filter(e => e.completed).map(e => ({ key: `episode:${e.episodeId}`, title: e.title, artwork: e.artwork, playedAt: e.playedAt, episode: e })),
    ].sort((a, b) => b.playedAt - a.playedAt);
  }, [authenticated, radios, podcasts, profile.radios, profile.episodes]);

  const radioSeed = authenticated ? radios[0] : profile.radios[0];
  const podcastSeed = authenticated ? podcasts[0] : profile.episodes[0];
  const radioSlug = radioSeed?.slug;
  const podcastSlug = podcastSeed && ("podcastSlug" in podcastSeed ? podcastSeed.podcastSlug : podcastSeed.slug);
  // At most one detail request for each seed; reuse the very same detail query
  // keys as catalog screens. Related results are already included by the API.
  const radioDetail = useQuery({ queryKey: ["radioStation", radioSlug || ""],
    queryFn: () => fetchRadioStationsBySlug(radioSlug!), enabled: !!radioSlug,
    staleTime: 3600000, retry: 1, refetchOnWindowFocus: false });
  const podcastDetail = useQuery({ queryKey: ["podcast", podcastSlug || ""],
    queryFn: () => fetchPodcastById(podcastSlug!), enabled: !!podcastSlug,
    staleTime: 3600000, retry: 1, refetchOnWindowFocus: false });

  // Guest history stores playback metadata; card details come from the existing catalog cache.
  const recentlyPlayedWithMetadata = useMemo(() => {
    const catalog = cachedCatalog(client);
    const bySlug = new Map(catalog.radios.map(r => [r.slug, r]));
    const podcastsBySlug = new Map(catalog.podcasts.map(p => [p.slug, p]));
    return recentlyPlayed.map(item => {
      if (item.episode) return { ...item, podcast: podcastsBySlug.get(item.episode.podcastSlug) };
      if (!item.radio) return item;
      const station = bySlug.get(item.radio.slug);
      if (!station) return item;
      return { ...item, radio: { ...item.radio,
        commentsCount: station.commentsCount, averageRating: station.averageRating } };
    });
  }, [client, recentlyPlayed, radioDetail.data, topStationQuery.data, podcastDetail.data, topPodcastQuery.data]);

  const radioRecommendations = useMemo(() => {
    if (!radioSeed) return [];
    const seed = radioDetail.data?.data || {
      id: "radioId" in radioSeed ? radioSeed.radioId : radioSeed.id, slug: radioSeed.slug,
      categories: "categories" in radioSeed ? radioSeed.categories : [],
      locations: "locations" in radioSeed ? radioSeed.locations : [],
    };
    const related = radioDetail.data?.relatedStations?.items || [];
    const candidates = [...related, ...cachedCatalog(client).radios];
    const popular = Array.isArray(topStationQuery.data) ? topStationQuery.data : [];
    return rankRelatedRadios(seed, candidates, new Map(popular.map((r, rank) => [r.slug, rank])));
  }, [client, radioSeed, radioDetail.data, topStationQuery.data]);
  const podcastRecommendations = useMemo(() => {
    if (!podcastSeed || !podcastSlug) return [];
    const seed = podcastDetail.data?.podcast || {
      id: "podcastId" in podcastSeed ? podcastSeed.podcastId : podcastSeed.id, slug: podcastSlug,
      categories: "categories" in podcastSeed ? podcastSeed.categories : [],
    };
    const related = podcastDetail.data?.relatedPodcast?.items || [];
    return rankRelated(seed, [...related, ...cachedCatalog(client).podcasts], new Set(related.map(p => p.id)));
  }, [client, podcastSeed, podcastSlug, podcastDetail.data, topPodcastQuery.data]);

  return { recentlyPlayed: recentlyPlayedWithMetadata, continuing, radioRecommendations, podcastRecommendations,
    radioSeedTitle: radioSeed?.title,
    podcastSeedTitle: podcastSeed && ("podcastTitle" in podcastSeed ? podcastSeed.podcastTitle : podcastSeed.title),
    historyLoading: authenticated && isLoading, historyError: authenticated && isError };
}
