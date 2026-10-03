import { getNowPlaying } from "@/core/radio-podcast/actions/radio/get-now-playing.action";
import { useQuery } from "@tanstack/react-query";

export function useNowPlaying(term: string, streamUrl: string, active: boolean) {
  return useQuery({
    queryKey: ["radio-now-playing", term, streamUrl],
    queryFn: ({ signal }) => getNowPlaying(term, signal),
    enabled: active && !!term && !!streamUrl,
    refetchInterval: active ? 15_000 : false,
    staleTime: 15_000,
    retry: false,
  });
}
