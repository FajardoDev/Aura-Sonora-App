import type { AudioPlayer } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { SleepTimer } from "../playback/SleepTimer";

export function useSleepTimer(player: AudioPlayer, pause: () => void, hasStream: boolean) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const latest = useRef({ player, pause });
  latest.current = { player, pause };
  const timer = useRef<SleepTimer | null>(null);

  useEffect(() => {
    const controller = new SleepTimer({
      getVolume: () => latest.current.player.volume,
      setVolume: volume => { latest.current.player.volume = volume; },
      pause: () => latest.current.pause(),
      onChange: setMinutesLeft,
    });
    timer.current = controller;
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") controller.refresh();
    });
    return () => {
      subscription.remove();
      controller.dispose();
      timer.current = null;
    };
  }, []);

  useEffect(() => { if (!hasStream) timer.current?.cancel(); }, [hasStream]);

  return {
    minutesLeft,
    start: (minutes: number) => timer.current?.start(minutes),
    cancel: () => timer.current?.cancel(),
  };
}
