import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { PodcastIDResponse } from "../../interface/podcast/podcast-responce-by-id.interface";

export const fetchPodcastById = async (slug: string) => {
	if (!slug) {
		throw new Error("El id de la estación no puede ser vacío.");
	}

	try {
		const { data } = await radioPodcastApi.get<PodcastIDResponse>(
			`/podcastrd/${slug}`,
		);

		return data;
	} catch (error: any) {
		// 1. Log profesional del error para fines de depuración
		console.log(
			`Error al obtener el podcast ${slug}:`,
			error.response?.data || error.message,
		);

		// cuerpo del error del backend.
		const status = error.response?.status;
		const backendErrorMessage = error.response?.data?.message;

		// 2. Manejo Específico del error 404
		if (status === 404) {
			// (ej: "Estación con id/id/title 'fh' no encontrada") mensaje específico
			const friendlyMessage = backendErrorMessage
				? backendErrorMessage
				: `El podcast con el id "${slug}" no fue encontrado.`;

			// Lanzamos un error con el mensaje específico para que el componente lo muestre.
			throw new Error(friendlyMessage);
		}

		// Error generico
		throw new Error(
			"Ocurrió un error inesperado. Por favor, inténtalo de nuevo más tarde.",
		);
	}
};
