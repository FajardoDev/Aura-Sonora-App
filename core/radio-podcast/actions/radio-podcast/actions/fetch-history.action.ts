/* eslint-disable @typescript-eslint/no-unused-vars */
import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { HistoryResponse } from "@/core/radio-podcast/interface/radio-podcast/history.interface";
import {
    HistoryQueryParameters,
    HistorysResponse,
} from "@/core/radio-podcast/interface/radio-podcast/historys.interface";

export const fetchHistory = async (): Promise<HistoryResponse> => {
	try {
		const url = "/latest-view/history";

		// Usamos el objeto params para pasar 'context=home'
		const { data } = await radioPodcastApi.get<HistoryResponse>(url, {
			params: { context: "home" },
		});

		return data;
	} catch (error) {
		console.log("❌ Error al obtener el historial de reproducciones:", error);
		// Devolvemos una estructura vacía si falla para no romper la UI del Home
		return { radios: [], podcasts: [] };
	}
};

export const fetchHistorys = async (
	params: HistoryQueryParameters,
): Promise<HistorysResponse> => {
	try {
		const url = "/latest-view/history";

		// Usamos el objeto params para pasar 'context=home'
		const { data } = await radioPodcastApi.get<HistorysResponse>(url, {
			params: params,
		});

		if (!data.meta) {
			console.warn(
				"⚠️ [fetchHistorys] Respuesta sin metadata. Usando valores por defecto.",
			);
			data.meta = {
				page: 1,
				limit: params.limit,
				totalItems: data.data.length,
				totalPages: 1,
			};
		}

		return data;
	} catch (error) {
		// console.error( "❌ Error al obtener el historial completo de reproducciones:", error );
		// Devolvemos una estructura vacía si falla para no romper la UI del Home
		return {
			data: [],
			meta: {
				page: params.page,
				limit: params.limit,
				totalItems: 0,
				totalPages: 0,
			},
		};
	}
};
