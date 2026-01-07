// hooks/useAudioPlayer.ts
import { Audio, AVPlaybackStatus } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";

export const useAudioPlayers = () => {
	const { streamUrl, isPlaying, togglePlay } = useAudioPlayerStore();
	const soundRef = useRef<Audio.Sound | null>(null);

	// ⏱️ Estados locales del player
	const [duration, setDuration] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState<number>(0);
	const [isBuffering, setIsBuffering] = useState<boolean>(false);

	// 🧠 Cargar el stream al cambiar de URL
	useEffect(() => {
		let isMounted = true;

		const loadAudio = async () => {
			if (!streamUrl) return;

			try {
				const { sound } = await Audio.Sound.createAsync(
					{ uri: streamUrl },
					{ shouldPlay: isPlaying },
					(status: AVPlaybackStatus) => {
						if (!isMounted || !status.isLoaded) return;

						// ⏱️ Actualizar duración y progreso
						setDuration(status.durationMillis! / 1000);
						setCurrentTime(status.positionMillis / 1000);
						setIsBuffering(status.isBuffering);
					},
				);

				soundRef.current = sound;
			} catch (error) {
				console.warn("Error cargando audio:", error);
			}
		};

		loadAudio();

		return () => {
			isMounted = false;
			if (soundRef.current) {
				soundRef.current.unloadAsync();
				soundRef.current = null;
			}
		};
	}, [streamUrl]);

	// ▶️ / ⏸️ Control de reproducción global
	useEffect(() => {
		const controlPlayback = async () => {
			if (!soundRef.current) return;
			const sound = soundRef.current;

			if (isPlaying) {
				await sound.playAsync();
			} else {
				await sound.pauseAsync();
			}
		};

		controlPlayback();
	}, [isPlaying]);

	// ⏩ Saltar a una posición del audio
	const seekTo = async (seconds: number) => {
		if (soundRef.current) {
			await soundRef.current.setPositionAsync(seconds * 1000);
		}
	};

	// 🔄 Reiniciar el audio
	const replay = async () => {
		if (soundRef.current) {
			await soundRef.current.replayAsync();
		}
	};

	return {
		duration,
		currentTime,
		isBuffering,
		isPlaying,
		seekTo,
		replay,
		togglePlay,
	};
};
