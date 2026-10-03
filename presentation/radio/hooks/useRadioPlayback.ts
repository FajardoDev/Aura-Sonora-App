import type { AudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { RadioPlaybackController, type RadioPlaybackState } from "../playback/RadioPlaybackController";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";

const INITIAL: RadioPlaybackState = {
  isConnecting: false, playbackError: null, retryCount: 0,
};

export function useRadioPlayback(player: AudioPlayer) {
  const [state, setState] = useState(INITIAL);
  const controllerRef = useRef<RadioPlaybackController | null>(null);

  useEffect(() => {
    let writingPlaying = false;
    const controller = new RadioPlaybackController(player, setState, (playing) => {
      if (useAudioPlayerStore.getState().isPlaying === playing) return;
      writingPlaying = true;
      useAudioPlayerStore.getState().togglePlay(playing);
      writingPlaying = false;
    });
    controllerRef.current = controller;
    const initial = useAudioPlayerStore.getState();
    if (initial.type === "radio") controller.select(initial.streamUrl, initial.isPlaying);
    const unsubscribe = useAudioPlayerStore.subscribe((next, previous) => {
      if (writingPlaying) return;
      if (next.streamUrl !== previous.streamUrl || next.type !== previous.type || next.slug !== previous.slug) {
        controller.select(next.type === "radio" ? next.streamUrl : null, next.isPlaying);
      } else if (next.type === "radio" && next.isPlaying !== previous.isPlaying) {
        controller.request(next.isPlaying);
      }
    });
    let ticking = false;
    const monitor = () => {
      // pause/replace can emit status synchronously; do not process recursively.
      if (ticking) return;
      ticking = true;
      try { controller.tick(); } finally { ticking = false; }
    };
    // Native events also synchronize controls while Android suspends JS timers
    // in background. Read currentStatus, never a queued event's source-less payload.
    const listener = player.addListener("playbackStatusUpdate", monitor);
    const interval = setInterval(monitor, 500);
    return () => {
      unsubscribe();
      clearInterval(interval);
      listener.remove();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [player]);

  return {
    ...state,
    retry: () => controllerRef.current?.retry(),
    pause: () => controllerRef.current?.request(false),
    toggle: () => {
      if (state.playbackError) controllerRef.current?.retry();
      else controllerRef.current?.request(!state.isConnecting && !useAudioPlayerStore.getState().isPlaying);
    },
  };
}
