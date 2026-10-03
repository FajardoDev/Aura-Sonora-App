import { useEffect } from "react";
import axios from "axios";
import { queryClient } from "@/core/query-client/queryClient";
import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { cachedCatalog } from "./catalog-cache";
import { buildGuestHistorySync, HistorySyncResult } from "./guest-history-sync";
import { EMPTY_PROFILE } from "./listening-model";
import { flushGuestListening, flushListeningStorage, listeningReady, useListeningStore } from "./useListeningStore";

// One observer for the application lifetime; no render-triggered sync or polling.
export function useGuestHistorySync() {
  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    // Auth clears QueryClient before publishing the new session. Remember only
    // bounded catalog identities while browsing as guest, never account history.
    const radios = new Map<string, { id: string; slug: string; radioid?: string }>();
    const podcasts = new Map<string, { id: string; slug: string }>();
    const rememberCatalog = () => {
      if (useAuthStore.getState().status === "authenticated") return;
      const catalog = cachedCatalog(queryClient);
      for (const r of catalog.radios) radios.set(r.id, { id: r.id, slug: r.slug, radioid: r.radioid });
      for (const p of catalog.podcasts) podcasts.set(p.id, { id: p.id, slug: p.slug });
      for (const collection of [radios, podcasts]) {
        while (collection.size > 600) collection.delete(collection.keys().next().value!);
      }
    };
    rememberCatalog();
    const stopCache = queryClient.getQueryCache().subscribe(rememberCatalog);
    const synchronize = async (ownerId: string, token: string, signal: AbortSignal) => {
      const stillOwner = () => !disposed && !signal.aborted && useAuthStore.getState().status === "authenticated" &&
        useAuthStore.getState().user?.id === ownerId && useAuthStore.getState().accessToken === token;
      try {
        await listeningReady();
        if (!stillOwner()) return;
        // Seal the existing guest tracker before taking the snapshot; no new audio.
        flushGuestListening();
        await flushListeningStorage();
        if (!stillOwner()) return;
        const state = useListeningStore.getState();
        const plan = buildGuestHistorySync(state.profiles.guest || EMPTY_PROFILE, state.guestSyncMarks, ownerId,
          { radios: [...radios.values()], podcasts: [...podcasts.values()] });
        if (!plan.references.length) return;
        state.markGuestHistorySync(ownerId, plan);
        await flushListeningStorage(); // Persist owner BEFORE sending, including failed requests.
        if (!stillOwner()) return;
        const { data } = await radioPodcastApi.post<HistorySyncResult>("/listening/sync-history", plan.payload, {
          signal, headers: { Authorization: `Bearer ${token}` }, timeout: 10000,
          // Axios's async token interceptor may see another session. Check at
          // dispatch as well as at completion so an A batch cannot use B's JWT.
          transformRequest: [(body, headers) => {
            if (!stillOwner() || headers.Authorization !== `Bearer ${token}`) throw new axios.CanceledError("Sesión cambiada");
            return JSON.stringify(body);
          }],
        });
        if (!stillOwner() || !data.success || !Array.isArray(data.radios) || !Array.isArray(data.podcasts)) return;
        useListeningStore.getState().markGuestHistorySync(ownerId, plan, data);
        await flushListeningStorage();
        if (stillOwner()) await queryClient.invalidateQueries({ queryKey: ["history"] });
      } catch {
        // Pending marks/local history survive. Retry on the next successful
        // login/session restoration; login and public navigation never wait.
      }
    };
    const onSession = () => {
      controller?.abort();
      const session = useAuthStore.getState();
      if (session.status !== "authenticated" || !session.user?.id || !session.accessToken) return;
      controller = new AbortController();
      void synchronize(session.user.id, session.accessToken, controller.signal);
    };
    const stopAuth = useAuthStore.subscribe((state, previous) => {
      if (state.status !== previous.status || state.user?.id !== previous.user?.id || state.accessToken !== previous.accessToken) onSession();
    });
    onSession();
    return () => { disposed = true; controller?.abort(); stopAuth(); stopCache(); };
  }, []);
}
