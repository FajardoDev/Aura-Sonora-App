/**
 * Filtra un array de episodios para eliminar duplicados.
 * Utiliza una combinación de Título y Fecha como clave única.
 * Cuando encuentra duplicados (Mismo Título y Fecha), prioriza el episodio que tenga la duración (o la más completa).
 * * @param episodes Array de episodios, potencialmente con duplicados (ej: uno con duración vacía y otro lleno).
 * @returns Array de episodios únicos.
 */
export const filterUniqueEpisodes = (episodes: any[]): any[] => {
	if (!episodes || episodes.length === 0) {
		return [];
	}

	// Usaremos un Map para almacenar el episodio "mejor" para cada clave única
	const uniqueEpisodesMap = new Map<string, any>();

	for (const episode of episodes) {
		// 1. Crear una clave única (Título + Fecha)
		const uniqueKey = `${episode.episodeTitle}__${episode.episodeDate}`;

		// 2. Verificar si ya tenemos un episodio con esta clave
		const existingEpisode = uniqueEpisodesMap.get(uniqueKey);

		if (!existingEpisode) {
			// Si no existe, lo agregamos directamente
			uniqueEpisodesMap.set(uniqueKey, episode);
		} else {
			// 3. Lógica de Resolución de Duplicados: Priorizar el que tenga duración
			const existingHasDuration =
				existingEpisode.duration && existingEpisode.duration.length > 0;
			const currentHasDuration = episode.duration && episode.duration.length > 0;

			if (currentHasDuration && !existingHasDuration) {
				// Si el episodio actual tiene duración y el existente no, reemplazamos el existente.
				uniqueEpisodesMap.set(uniqueKey, episode);
			}
			// Si ambos tienen duración o ninguno tiene, mantenemos el existente (el primero que encontramos).
		}
	}

	// 4. Devolver los valores del Map como un array
	return Array.from(uniqueEpisodesMap.values());
};
