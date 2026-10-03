import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { EMPTY_PROFILE, EpisodeListen, ListeningProfile, RadioListen, upsertEpisode, upsertRadio } from "./listening-model";

import { HistorySyncMarks, HistorySyncResult, SyncPlan, updateSyncMarks } from "./guest-history-sync";

const guestFlushers = new Set<() => void>();
export function registerGuestListeningFlush(flush: () => void) {
  guestFlushers.add(flush);
  return () => { guestFlushers.delete(flush); };
}
export function flushGuestListening() { guestFlushers.forEach(flush => flush()); }

interface ListeningState {
  guestSyncMarks: HistorySyncMarks;
  markGuestHistorySync: (ownerId: string, plan: SyncPlan, result?: HistorySyncResult) => void;
  profiles: Record<string, ListeningProfile>;
  ready: boolean;
  setReady: () => void;
  recordRadio: (scope: string, radio: RadioListen, now: number) => void;
  recordEpisode: (scope: string, episode: EpisodeListen, position: number, duration: number, now: number, first: boolean) => void;
}

// Serialize writes so a pause/checkpoint cannot be overwritten by an older write.
let writes: Promise<unknown> = Promise.resolve();
const storage: StateStorage = {
  getItem: name => AsyncStorage.getItem(name),
  setItem: (name, value) => {
    writes = writes.catch(() => {}).then(() => AsyncStorage.setItem(name, value));
    return writes as Promise<void>;
  },
  removeItem: name => AsyncStorage.removeItem(name),
};

function boundedProfiles(profiles: Record<string, ListeningProfile>) {
  const accounts = Object.entries(profiles).filter(([key]) => key !== "guest")
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, 3);
  return Object.fromEntries([...(profiles.guest ? [["guest", profiles.guest]] : []), ...accounts]);
}

export const useListeningStore = create<ListeningState>()(persist((set, get) => ({
  profiles: {},
  guestSyncMarks: {},
  markGuestHistorySync: (ownerId, plan, result) => set(state => ({
    guestSyncMarks: updateSyncMarks(state.profiles.guest || EMPTY_PROFILE, state.guestSyncMarks, ownerId, plan, result),
  })),
  ready: false,
  setReady: () => set({ ready: true }),
  recordRadio: (scope, radio, now) => {
    if (!get().ready) return;
    set(state => ({ profiles: boundedProfiles({ ...state.profiles,
      [scope]: upsertRadio(state.profiles[scope] || EMPTY_PROFILE, radio, now) }) }));
  },
  recordEpisode: (scope, episode, position, duration, now, first) => {
    if (!get().ready) return;
    set(state => ({ profiles: boundedProfiles({ ...state.profiles,
      [scope]: upsertEpisode(state.profiles[scope] || EMPTY_PROFILE, episode, position, duration, now, first) }) }));
  },
}), {
  name: "aura-listening-v1",
  version: 1,
  storage: createJSONStorage(() => storage),
  partialize: state => ({ profiles: state.profiles, guestSyncMarks: state.guestSyncMarks }),
  onRehydrateStorage: () => (state, error) => {
    // A failed read must not block public navigation or playback.
    if (error) console.warn("No se pudo restaurar el historial local");
    if (state) state.setReady();
    else queueMicrotask(() => useListeningStore.getState().setReady());
  },
}));

export async function listeningReady() {
  if (!useListeningStore.getState().ready) await new Promise<void>(resolve => {
    const unsubscribe = useListeningStore.subscribe(state => {
      if (state.ready) { unsubscribe(); resolve(); }
    });
  });
}

export function flushListeningStorage() { return writes; }
