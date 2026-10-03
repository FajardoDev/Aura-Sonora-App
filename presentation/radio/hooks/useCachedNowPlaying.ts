import type { RadioNowPlaying } from "@/core/radio-podcast/actions/radio/get-now-playing.action";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";

/** Observe the player's cache without adding a query observer or polling. */
export function useCachedNowPlaying(slug: string, stream: string, active: boolean) {
  const client = useQueryClient();
  const subscribe = useCallback((notify: () => void) => client.getQueryCache().subscribe(event => {
    const key = event.query.queryKey;
    if (key[0] === "radio-now-playing" && key[1] === slug && key[2] === stream) notify();
  }), [client, slug, stream]);
  const snapshot = useCallback(() => active
    ? client.getQueryData<RadioNowPlaying>(["radio-now-playing", slug, stream])
    : undefined, [client, slug, stream, active]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
