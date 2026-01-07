import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { LastComment } from "../../../interface/radio/radio-station-responce-by-slug.interface";

export interface CommentMeta {
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
}

export interface CommentResponse {
	meta: CommentMeta;
	comments: LastComment[]; // Asumo que LastComment ya está tipado correctamente
}

// 📡 Obtener comentarios paginados
export const fetchCommentsByEntity = async (
	type: "radio" | "podcast",
	entityId: string,
	page: number = 1,
	limit: number = 10,
): Promise<CommentResponse> => {
	try {
		const endpoint =
			type === "radio"
				? `/comments/radio-station/${entityId}`
				: `/comments/podcastrd/${entityId}`;

		const { data } = await radioPodcastApi.get<CommentResponse>(endpoint, {
			params: { page, limit },
		});

		return data;
	} catch (error) {
		console.log("❌ Error al cargar comentarios:", error);
		throw new Error("No se pudieron obtener los comentarios");
	}
};
// // 📡 Obtener comentarios paginados
// export const fetchCommentsByEntity = async (
//     type: "radio" | "podcast",
//     entityId: string,
//     page: number = 1,
//     limit: number = 10,
// ) => {
//     try {
//         const endpoint =
//             type === "radio"
//                 ? `/comments/radio-station/${entityId}`
//                 : `/comments/podcastrd/${entityId}`;

//         const { data } = await radioPodcastApi.get<{
//             comments: LastComment[];
//             meta: { totalPages: number };
//         }>( endpoint, {
//             params: { page, limit },
//         } );

//         return data;
//     } catch ( error ) {
//         console.error( "❌ Error al cargar comentarios:", error );
//         throw new Error( "No se pudieron obtener los comentarios" );
//     }
// };

// 📝 Crear comentario
export const createComment = async (
	payload: {
		content: string;
		rating: number;
		radioStationId: string | null;
		podcastId: string | null;
	},
	type: "radio" | "podcast",
	entityId: string,
) => {
	try {
		// 🔹 Determinar endpoint según tipo
		const endpoint =
			type === "radio"
				? `/comments/radio-station/${entityId}`
				: `/comments/podcastrd/${entityId}`;

		const { data } = await radioPodcastApi.post(endpoint, payload);

		return data;
	} catch (error: any) {
		console.error(
			"❌ Error respuesta servidor:",
			error.response?.data || error,
		);
		throw new Error("No se pudo crear el comentario");
	}
};

// ✏️ Actualizar comentario
export const updateComment = async (
	id: string,
	payload: { content: string; rating: number },
) => {
	try {
		const { data } = await radioPodcastApi.patch<LastComment>(
			`/comments/${id}`,
			payload,
		);
		return data;
	} catch (error) {
		console.error("❌ Error al actualizar comentario:", error);
		throw new Error("No se pudo actualizar el comentario");
	}
};

// 🗑️ Eliminar comentario
export const deleteComment = async (id: string) => {
	try {
		await radioPodcastApi.delete(`/comments/${id}`);
		return true;
	} catch (error) {
		console.error("❌ Error al eliminar comentario:", error);
		throw new Error("No se pudo eliminar el comentario");
	}
};
