import { useMemo } from "react";
import { usePodcast } from "../podcast/hooks/usePodcasts";
import { useRadioStation } from "../radio/hooks/useRadioStation";

export const useGlobalSearch = (query: string) => {
  const term = query.trim();
  // Las tabs conservan sus consultas públicas; Home solo busca si hay texto.
  const { podcastQuery } = usePodcast(term, term.length > 0);
  const { radioStationQuery } = useRadioStation(term, term.length > 0);
  const radios = useMemo(() => {
    if (radioStationQuery.isPlaceholderData) return [];
    const items = radioStationQuery.data?.pages?.flatMap(page =>
      Array.isArray(page?.stations) ? page.stations : []) ?? [];
    const validItems = items.filter(item => item?.id && item?.slug);
    return [...new Map(validItems.map(item => [item.id, item])).values()].slice(0, 6);
  }, [radioStationQuery.data, radioStationQuery.isPlaceholderData]);
  const podcasts = useMemo(() => {
    if (podcastQuery.isPlaceholderData) return [];
    const items = podcastQuery.data?.pages?.flatMap(page =>
      Array.isArray(page?.podcast) ? page.podcast : []) ?? [];
    const validItems = items.filter(item => item?.id && item?.slug);
    return [...new Map(validItems.map(item => [item.id, item])).values()].slice(0, 6);
  }, [podcastQuery.data, podcastQuery.isPlaceholderData]);
  return { radioStationQuery, podcastQuery, radios, podcasts };
};
