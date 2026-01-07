// useEpisodeDownloads.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as FileSystem from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback } from "react";

/**
 * NOTE sobre typings:
 * En algunos entornos TS la propiedad `documentDirectory` puede no estar bien tipada.
 * Por eso usamos (FileSystem as any).documentDirectory como fallback para evitar errores de TS.
 */

const DOWNLOADS_KEY = "@rp_downloaded_episodes_v1";

/** Tipo de entrada de descarga */
export type DownloadEntry = {
	id: string; // episode id
	podcastId?: string;
	title: string;
	fileName: string;
	localUri: string;
	size?: number;
	downloadedAt: string;
	image?: string;
};

const getSafeBaseDir = (): string => {
	// Intentamos documentDirectory, si no existe usamos cacheDirectory, si no existe devolvemos cadena vacía.
	const fsAny = FileSystem as any;
	return fsAny.documentDirectory ?? fsAny.cacheDirectory ?? "";
};

const normalizeFileName = (name: string) =>
	name.replace(/[^a-z0-9_\-\.]/gi, "_").toLowerCase();

/** Asegura que exista el directorio de descargas y devuelve su path */
const ensureDownloadsDir = async (): Promise<string> => {
	const base = getSafeBaseDir();
	if (!base)
		throw new Error(
			"No se encontró un directorio accesible (documentDirectory/cacheDirectory).",
		);

	const downloadsDir = `${base}downloads/`;
	try {
		const info = await FileSystem.getInfoAsync(downloadsDir);
		if (!info.exists) {
			await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
		}
		return downloadsDir;
	} catch (err) {
		// Reintento simple: intentar crear sin intermediates
		try {
			await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
			return downloadsDir;
		} catch (e) {
			console.error("ensureDownloadsDir error:", e);
			throw e;
		}
	}
};

/**
 * Hook/utility: manejar descargas de episodios (persistencia + archivos)
 * - getAll: lista entries guardadas (AsyncStorage)
 * - isDownloaded: chequear si ya se descargó
 * - download: descarga resumible con progreso
 * - remove: borrar archivo y metadatos
 */
export const useEpisodeDownloads = () => {
	// Obtener lista persistente
	const getAll = useCallback(async (): Promise<DownloadEntry[]> => {
		try {
			const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
			return raw ? JSON.parse(raw) : [];
		} catch (e) {
			console.error("useEpisodeDownloads.getAll", e);
			return [];
		}
	}, []);

	// Guardar lista completa
	const saveAll = useCallback(async (list: DownloadEntry[]) => {
		try {
			await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
		} catch (e) {
			console.error("useEpisodeDownloads.saveAll", e);
		}
	}, []);

	// Comprobar si está descargado
	const isDownloaded = useCallback(
		async (episodeId: string): Promise<DownloadEntry | null> => {
			const list = await getAll();
			return list.find((x) => x.id === episodeId) ?? null;
		},
		[getAll],
	);

	// Eliminar archivo + metadata
	const remove = useCallback(
		async (episodeId: string) => {
			const list = await getAll();
			const entry = list.find((x) => x.id === episodeId);
			if (!entry) return false;

			try {
				const info = await FileSystem.getInfoAsync(entry.localUri);
				if (info.exists) {
					// deleteAsync es idempotent con la opción
					await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
				}
			} catch (e) {
				console.warn("useEpisodeDownloads.remove - error deleting file:", e);
			}

			const newList = list.filter((x) => x.id !== episodeId);
			await saveAll(newList);
			return true;
		},
		[getAll, saveAll],
	);

	// Descargar episodio (resumible) con callback de progreso opcional
	const download = useCallback(
		async (
			ep: {
				id: string;
				audioUrl: string;
				episodeTitle: string;
				podcastId?: string;
				image?: string;
			},
			onProgress?: (percent: number) => void,
		): Promise<{ uri: string }> => {
			if (!ep || !ep.id || !ep.audioUrl)
				throw new Error("download: datos incompletos");

			// Asegurar directorio
			const downloadsDir = await ensureDownloadsDir();
			const filename = normalizeFileName(`${ep.id}.mp3`);
			const fileUri = `${downloadsDir}${filename}`;

			// Reusar si ya existe en metadata y en FS
			const existing = await isDownloaded(ep.id);
			if (existing) {
				const info = await FileSystem.getInfoAsync(existing.localUri);
				if (info.exists) return { uri: existing.localUri };
			}

			// Crear DownloadResumable (expo-file-system)
			const downloadResumable = FileSystem.createDownloadResumable(
				ep.audioUrl,
				fileUri,
				{},
				(progress) => {
					try {
						// progress.totalBytesExpectedToWrite puede ser 0 o undefined en algunos servidores
						if (!progress || !progress.totalBytesExpectedToWrite) {
							// si no hay total, envia -1 o 0 para indicar "progreso indeterminado"
							onProgress?.(-1);
							return;
						}
						const percent =
							(progress.totalBytesWritten / progress.totalBytesExpectedToWrite) *
							100;
						onProgress?.(Math.max(0, Math.min(100, Math.round(percent))));
					} catch (e) {
						// defensivo
					}
				},
			);

			try {
				const result = await downloadResumable.downloadAsync();
				if (!result?.uri) throw new Error("downloadAsync no devolvió uri");

				// Construir entry y persistir
				const entry: DownloadEntry = {
					id: ep.id,
					podcastId: ep.podcastId,
					title: ep.episodeTitle,
					fileName: filename,
					localUri: result.uri,
					size: result.headers
						? Number(result.headers["Content-Length"] ?? 0)
						: undefined,
					downloadedAt: new Date().toISOString(),
					image: ep.image,
				};

				const list = await getAll();
				const newList = [...list.filter((x) => x.id !== ep.id), entry];
				await saveAll(newList);

				return { uri: result.uri };
			} catch (err) {
				// intento de limpieza parcial si algo quedó
				try {
					await FileSystem.deleteAsync(fileUri, { idempotent: true });
				} catch {}
				console.error("useEpisodeDownloads.download error:", err);
				throw err;
			}
		},
		[getAll, isDownloaded, saveAll],
	);

	// Listar archivos en downloads directory (metadata independiente)
	const listFiles = useCallback(async (): Promise<string[]> => {
		try {
			const downloadsDir = getSafeBaseDir()
				? `${getSafeBaseDir()}downloads/`
				: "";
			if (!downloadsDir) return [];
			const info = await FileSystem.getInfoAsync(downloadsDir);
			if (!info.exists) return [];
			return await FileSystem.readDirectoryAsync(downloadsDir);
		} catch (e) {
			console.warn("useEpisodeDownloads.listFiles error:", e);
			return [];
		}
	}, []);

	return {
		getAll,
		isDownloaded,
		download,
		remove,
		listFiles,
	};
};

export default useEpisodeDownloads;

// Los links vienen asi  https://www.spreaker.com/episode/05-cuando-suenas-contigo-y-te-sientes-feliz--62489614,https://dts.podtrac.com/redirect.mp3/op3.dev/e/api.spreaker.com/download/episode/62489614/est05.mp3,https://podcastindex.org/podcast/6592808?episode=15575655036   y en la web hice algo asi con los episodes y funcionaba   {/* Enlace de descarga usando la URL del episodio */}
// 								<a
// 									href={episode.links[1]?.url} // Asegúrate de que esta URL sea accesible
// 									download // Atributo que permite la descarga del archivo
// 									className="text-blue-500 hover:underline flex items-center gap-2 cursor-pointer"
// 									title={`Descargar ${episode.episodeTitle}`}
// 								>
// 									<FaDownload /> Descargar
// 								</a>  pero en la web el user lo podia descargar asi   	Al hacer clic en `Descargar`, serás redirigido a una página externa donde
// podrás escuchar el episodio del podcast. Para descargarlo en tu
// dispositivo, solo haz clic en los tres puntos del reproductor y
// selecciona la opción de descarga.       que me recomiendas

// https://podcasters.spotify.com/pod/show/elbrifin/episodes/Lunes-26-de-agosto-del-2024-e2nk1g1,

// https://anchor.fm/s/aaeab0c8/podcast/play/90883009/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2024-7-26%2F36bfbc97-11a6-127c-388f-a01db9a5a889.mp3,

// https://podcastindex.org/podcast/744138?episode=27262597555

// // useEpisodeDownloads.ts
// import AsyncStorage from "@react-native-async-storage/async-storage";
// // import * as FileSystem from "expo-file-system";
// import { Directory, File, Paths } from "expo-file-system";

// import { useCallback } from "react";

// const DOWNLOADS_KEY = "@rp_downloaded_episodes_v2";

// export type DownloadEntry = {
// 	id: string; // episode id
// 	podcastId?: string;
// 	title: string;
// 	fileName: string;
// 	localUri: string;
// 	size?: number;
// 	downloadedAt: string;
// 	image?: string;
// };

// const getDownloadsDir = () => new Directory(Paths.document, "downloads");

// export const useEpisodeDownloads = () => {
// 	// Obtiene la lista de descargas persistida
// 	const getAll = useCallback(async (): Promise<DownloadEntry[]> => {
// 		try {
// 			const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
// 			return raw ? JSON.parse(raw) : [];
// 		} catch (e) {
// 			console.error("useEpisodeDownloads.getAll", e);
// 			return [];
// 		}
// 	}, []);

// 	// Guarda la lista completa
// 	const saveAll = useCallback(async (list: DownloadEntry[]) => {
// 		await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(list));
// 	}, []);

// 	const isDownloaded = useCallback(
// 		async (episodeId: string): Promise<DownloadEntry | null> => {
// 			const list = await getAll();
// 			return list.find((x) => x.id === episodeId) ?? null;
// 		},
// 		[getAll],
// 	);

// 	// Borrar un episodio (archivo + metadata)
// 	const remove = useCallback(
// 		async (episodeId: string) => {
// 			const list = await getAll();
// 			const entry = list.find((x) => x.id === episodeId);
// 			if (!entry) return false;

// 			try {
// 				// Borra archivo si existe
// 				if (entry.localUri) {
// 					await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
// 				}
// 			} catch (e) {
// 				console.warn("Failed to delete file:", e);
// 			}

// 			const newList = list.filter((x) => x.id !== episodeId);
// 			await saveAll(newList);
// 			return true;
// 		},
// 		[getAll, saveAll],
// 	);

// 	// Inicio de descarga (retorna objeto con control)
// 	const download = useCallback(
// 		async (
// 			ep: {
// 				id: string;
// 				audioUrl: string;
// 				episodeTitle: string;
// 				podcastId?: string;
// 				image?: string;
// 			},
// 			onProgress?: (progressPercent: number) => void,
// 			resume?: boolean,
// 		): Promise<{ uri: string; cancel: () => Promise<void> }> => {
// 			const filename = `${ep.id}.mp3`;
// 			const fileUri = `${getDocumentDir()}${filename}`;

// 			// Si ya existe metadata y archivo -> devolver
// 			const already = await isDownloaded(ep.id);
// 			if (already) {
// 				return { uri: already.localUri, cancel: async () => {} };
// 			}

// 			// Check espacio disponible (opcional): getFreeDiskStorageAsync en android/ios
// 			try {
// 				const free = await FileSystem.getFreeDiskStorageAsync?.();
// 				if (typeof free === "number" && free < 5 * 1024 * 1024) {
// 					// menos de 5MB libre
// 					throw new Error("Espacio insuficiente para la descarga.");
// 				}
// 			} catch {
// 				// ignore si no disponible
// 			}

// 			// Create resumable download
// 			const downloadResumable = FileSystem.createDownloadResumable(
// 				ep.audioUrl,
// 				fileUri,
// 				{},
// 				(progress) => {
// 					if (!progress || !onProgress) return;
// 					const percent =
// 						(progress.totalBytesWritten /
// 							(progress.totalBytesExpectedToWrite || 1)) *
// 						100;
// 					onProgress(Math.min(100, Math.round(percent)));
// 				},
// 			);

// 			// Start download
// 			try {
// 				const result = await downloadResumable.downloadAsync();
// 				// eslint-disable-next-line eqeqeq
// 				if (result.status != 200 && result.status != 201) {
// 					// Status not ok, delete file if any
// 					try {
// 						await FileSystem.deleteAsync(fileUri, { idempotent: true });
// 					} catch {}
// 					throw new Error(`Error al descargar (status ${result.status})`);
// 				}

// 				const entry: DownloadEntry = {
// 					id: ep.id,
// 					podcastId: ep.podcastId,
// 					title: ep.episodeTitle,
// 					fileName: filename,
// 					localUri: result.uri,
// 					size:
// 						result.headers && result.headers["content-length"]
// 							? Number(result.headers["content-length"])
// 							: undefined,
// 					downloadedAt: new Date().toISOString(),
// 					image: ep.image,
// 				};

// 				const list = await getAll();
// 				const newList = [...list.filter((x) => x.id !== ep.id), entry];
// 				await saveAll(newList);

// 				return { uri: result.uri, cancel: async () => {} };
// 			} catch (err) {
// 				// Si falla, intentar borrar parcial
// 				try {
// 					await FileSystem.deleteAsync(fileUri, { idempotent: true });
// 				} catch {}
// 				throw err;
// 			}
// 		},
// 		[getAll, isDownloaded, saveAll],
// 	);

// 	return {
// 		getAll,
// 		isDownloaded,
// 		download,
// 		remove,
// 	};
// };
