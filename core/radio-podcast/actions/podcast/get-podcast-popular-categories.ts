import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { PopularCategoriesResponse } from "../radio/get-station-popular-categories";

export const getPopularCategoriesPodcast =
	async (): Promise<PopularCategoriesResponse> => {
		try {
			const { data } = await radioPodcastApi.get<PopularCategoriesResponse>(
				"/podcastrd/popular-categories",
			);

			return data;
		} catch (error) {
			console.log("❌ Error al obtener las categorías populares:", error);
			throw new Error("No se pudo obtener la categorías de podcasts Populares.");
		}
	};