import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { type EntityType } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";

// Payload base para la mutación
export interface LatestViewPayload {
	type: EntityType;
	radioStationId?: string;
	podcastId?: string;
}

// Respuesta esperada de la API
interface LatestViewResponse {
	success: boolean;
	message: string;
}

export const registerLatestView = async (
	payload: LatestViewPayload,
): Promise<LatestViewResponse> => {
	try {
		const { type, radioStationId, podcastId } = payload;

		// 1. Validar el payload
		if (type === "radio" && !radioStationId) {
			throw new Error("Se requiere 'radioStationId' para el tipo 'radio'.");
		}
		if (type === "podcast" && !podcastId) {
			throw new Error("Se requiere 'podcastId' para el tipo 'podcast'.");
		}

		// 2. Construir el cuerpo de la solicitud (solo incluir el ID relevante)
		const body = {
			type,
			...(type === "radio" && { radioStationId }),
			...(type === "podcast" && { podcastId }),
		};

		// 3. Llamada POST a la API
		const { data } = await radioPodcastApi.post<LatestViewResponse>(
			"/latest-view",
			body,
		);

		console.log(`✅ Registro de última vista (${type}) exitoso.`);
		return data;
	} catch (error) {
		console.log("❌ Error al registrar la última vista:", error);
		throw new Error("No se pudo registrar la última vista en el servidor.");
	}
};
