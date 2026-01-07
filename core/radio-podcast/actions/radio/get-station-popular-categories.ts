import { radioPodcastApi } from "@/core/api/radioPodcastApi";

export interface PopularCategoriesResponse {
	category: string;
	totalStations: number;
	favorites: number;
	comments: number;
	averageRating: number;
	popularityScore: number;
}

export const getPopularCategoriesStation =
	async (): Promise<PopularCategoriesResponse> => {
		try {
			const { data } = await radioPodcastApi.get<PopularCategoriesResponse>(
				"/radio-station/popular-categories",
			);

			return data;
		} catch (error) {
			console.log("❌ Error al obtener las categorías populares:", error);
			throw new Error("No se pudo obtener la categorías de radios Populares.");
		}
	};
