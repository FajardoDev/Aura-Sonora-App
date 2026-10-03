import type { AudioPlayer, AudioStatus } from "expo-audio";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import { cachedCatalog } from "./catalog-cache";
import { EMPTY_PROFILE, ListeningSession, ListeningSource, scopeForUser } from "./listening-model";
import { registerGuestListeningFlush, useListeningStore } from "./useListeningStore";

export function useListeningProgress(player: AudioPlayer, status: AudioStatus) {
  const client = useQueryClient();
  const auth = useAuthStore(state => state.status);
  const userId = useAuthStore(state => state.user?.id);
  const ready = useListeningStore(state => state.ready);
  const { streamUrl, slug, episodeSlug, radioid, radioName, radioimg, type, listeningSource, resumeRequest } = useAudioPlayerStore();
  const scope = scopeForUser(auth === "authenticated" ? userId : undefined);
  const source = useMemo<ListeningSource | null>(() => {
    if (!streamUrl || !slug || auth === "cheking") return null;
    const catalog = cachedCatalog(client);
    if (listeningSource) {
      const podcast = listeningSource.kind === "podcast" ? catalog.podcasts.find(p => p.slug === listeningSource.podcastSlug) : undefined;
      return { ...listeningSource, stream: streamUrl, categories: listeningSource.categories.length ? listeningSource.categories : podcast?.categories || [] };
    }
    if (type === "radio") {
      const station = catalog.radios.find(r => r.slug === slug);
      return { kind: "radio", radioId: station?.id || radioid || slug, slug,
        title: station?.radioname || radioName || slug, artwork: station?.radioimg || radioimg || "",
        stream: streamUrl, radioid: station?.radioid || radioid || "",
        categories: station?.categories || [], locations: station?.locations || [] };
    }
    const profile = useListeningStore.getState().profiles[scope] || EMPTY_PROFILE;
    const episode = profile.episodes.find(e => e.podcastSlug === slug && e.episodeSlug === episodeSlug);
    return episode ? { ...episode, stream: streamUrl } : null;
  }, [client, streamUrl, slug, episodeSlug, radioid, radioName, radioimg, type, listeningSource, scope, auth, ready]);
  const latest = useRef(status);
  latest.current = status;
  const tracker = useRef<ListeningSession | null>(null);
  const sourceKey = source?.kind === "radio" ? source.radioId : source?.episodeId;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  useEffect(() => {
    const activeSource = sourceRef.current;
    if (!activeSource || !ready || auth === "cheking") return;
    const session = new ListeningSession(activeSource, (position, duration, now, first) => {
      const store = useListeningStore.getState();
      if (activeSource.kind === "radio") {
        // Authenticated radio history remains backend-owned.
        if (scope === "guest") store.recordRadio(scope, activeSource, now);
      } else store.recordEpisode(scope, activeSource, position, duration, now, first);
    });
    tracker.current = session;
    const unregisterGuestFlush = scope === "guest" ? registerGuestListeningFlush(() => session.flush(Date.now())) : undefined;
    const interval = setInterval(() => {
      const sample = latest.current;
      session.sample({ loaded: sample.isLoaded, playing: sample.playing,
        buffering: sample.isBuffering, position: sample.currentTime, duration: sample.duration }, Date.now());
    }, 1000);
    const subscription = AppState.addEventListener("change", state => {
      if (state !== "active") session.flush(Date.now());
    });
    return () => {
      clearInterval(interval); subscription.remove(); session.flush(Date.now());
      unregisterGuestFlush?.();
      if (tracker.current === session) tracker.current = null;
    };
  }, [sourceKey, streamUrl, scope, ready, auth]);

  // Flush on native pause (including lock-screen controls), without per-frame writes.
  useEffect(() => { if (!status.playing) tracker.current?.flush(Date.now()); }, [status.playing]);

  const resumed = useRef<string | null>(null);
  useEffect(() => {
    if (type !== "podcast" || !source || source.kind !== "podcast" || !ready || !status.isLoaded || !player.isLoaded || !(status.duration > 0)) return;
    const key = `${streamUrl}:${resumeRequest?.sequence || 0}`;
    if (resumed.current === key) return;
    const saved = useListeningStore.getState().profiles[scope]?.episodes.find(e => e.episodeId === source.episodeId);
    const position = resumeRequest?.position ?? (saved && !saved.completed ? saved.position : 0);
    resumed.current = key;
    if (position > 0) void player.seekTo(Math.min(position, Math.max(0, status.duration - 1))).catch(() => {
      console.warn("No se pudo restaurar la posición del episodio");
    });
  }, [player, source, ready, type, streamUrl, scope, resumeRequest, status.isLoaded, status.duration]);
}
