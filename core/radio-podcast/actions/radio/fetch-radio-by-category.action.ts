import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { RadioCategoryResponse } from "../../interface/radio/radio-category.interface";

export const fetchRadiosByCategory = async (
	page: number = 1,
	limit: number = 10,
	category: string,
): Promise<RadioCategoryResponse> => {
	try {
		const url = `/radio-station/category/${category}`;

		const { data } = await radioPodcastApi.get<RadioCategoryResponse>(url, {
			params: { page: page, limit: limit },
		});

		return data;
	} catch (error) {
		console.log("❌ Error al obtener la radio por categoría:", error);
		throw new Error("No se pudo obtener la radio de la categoría.");
	}
};
