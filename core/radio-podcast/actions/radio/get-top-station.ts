import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { TopStationResponse } from "../../interface/radio/station-top-response";

export const getTopStation = async (): Promise<TopStationResponse> => {
	try {
		const { data } = await radioPodcastApi.get<TopStationResponse>(
			"/radio-station/top",
		);

		return data;
	} catch (error) {
		console.log("❌ Error al obtener Top 9 Emisoras Más Populares:", error);
		throw new Error("No se pudo obtener la radios Populares.");
	}
};
