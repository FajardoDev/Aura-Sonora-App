import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { PodcastCategoryResponse } from "../../interface/podcast/podcast-category.interface";

export const fetchPodcastsByCategory = async (
	page: number = 1,
	limit: number = 10,
	category: string,
): Promise<PodcastCategoryResponse> => {
	try {
		const url = `/podcastrd/category/${category}`;

		const { data } = await radioPodcastApi.get<PodcastCategoryResponse>(url, {
			params: { page: page, limit: limit },
		});

		return data;
	} catch (error) {
		console.log("❌ Error al obtener los podcasts por categoría:", error);
		throw new Error("No se pudo obtener los podcasts de la categoría.");
	}
};
