// store/useDownloadsStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface Download {
	id: string;
	title: string;
	uri: string;
	duration?: number;
	podcastTitle?: string;
	image?: string;
	description: string;
}

interface DownloadsState {
	downloads: Download[];
	addDownload: (download: Download) => void;
	removeDownload: (id: string) => void;
	loadDownloads: () => Promise<void>;
	getDownloadedEpisode: (id: string) => Download | undefined; // 🆕 nuevo método

	downloadingIds: string[]; // 🆕 IDs de episodios en proceso
	markAsDownloading: (id: string) => void;
	unmarkAsDownloading: (id: string) => void;
}

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
	downloads: [],
	downloadingIds: [],

	addDownload: async (download) => {
		const updated = [download, ...get().downloads];
		set({ downloads: updated });
		await AsyncStorage.setItem("downloads", JSON.stringify(updated));
	},

	removeDownload: async (id) => {
		const updated = get().downloads.filter((d) => d.id !== id);
		set({ downloads: updated });
		await AsyncStorage.setItem("downloads", JSON.stringify(updated));
	},

	loadDownloads: async () => {
		const stored = await AsyncStorage.getItem("downloads");
		if (stored) set({ downloads: JSON.parse(stored) });
	},

	getDownloadedEpisode: (id) => {
		return get().downloads.find((d) => d.id === id);
	},

	markAsDownloading: (id) =>
		set((state) => ({
			downloadingIds: [...state.downloadingIds, id],
		})),

	unmarkAsDownloading: (id) =>
		set((state) => ({
			downloadingIds: state.downloadingIds.filter((d) => d !== id),
		})),
}));
