import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { RadioStationResponseBySlug } from "../../interface/radio/radio-station-responce-by-slug.interface";

export const fetchRadioStationsBySlug = async (slug: string) => {
	if (!slug) {
		throw new Error("El slug de la estación no puede ser vacío.");
	}

	try {
		const { data } = await radioPodcastApi.get<RadioStationResponseBySlug>(
			`/radio-station/${slug}`,
		);
		return data;
	} catch (error: any) {
		// 1. Log profesional del error para fines de depuración
		console.log(
			`Error al obtener la estación ${slug}:`,
			error.response?.data || error.message,
		);

		// cuerpo del error del backend.
		const status = error.response?.status;
		const backendErrorMessage = error.response?.data?.message;

		// 2. Manejo Específico del error 404
		if (status === 404) {
			// (ej: "Estación con id/slug/title 'fh' no encontrada") mensaje específico
			const friendlyMessage = backendErrorMessage
				? backendErrorMessage
				: `La estación con el slug "${slug}" no fue encontrada.`;

			// Lanzamos un error con el mensaje específico para que el componente lo muestre.
			throw new Error(friendlyMessage);
		}

		// Error generico
		throw new Error(
			"Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
		);
	}
};
