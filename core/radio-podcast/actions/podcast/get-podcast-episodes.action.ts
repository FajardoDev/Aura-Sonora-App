import { radioPodcastApi } from "@/core/api/radioPodcastApi";

import { type PodcastEpisodesResponse } from "../../interface/podcast/podcast-episodes.interface";

export const fetchPodcastsEpisodes = async (
	page: number = 1,
	limit: number = 10,
	podcastId: string,
): Promise<PodcastEpisodesResponse> => {
	try {
		const url = `/podcastrd/${podcastId}/episodes`;

		const { data } = await radioPodcastApi.get<PodcastEpisodesResponse>(url, {
			params: { page: page, limit: limit },
		});

		return data;
	} catch (error) {
		console.log("Error al obtener los episodios:", error);
		throw new Error("No se pudo obtener los episodios del podcast.");
	}
};
