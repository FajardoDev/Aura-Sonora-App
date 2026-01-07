/**
 * Devuelve el primer enlace directo de audio (.mp3, .wav, .ogg)
 * o `null` si no se encuentra ninguno.
 */
export const extractDirectAudioLink = (links: string[]): string | null => {
	if (!Array.isArray(links)) return null;

	// Patrón regex expandido para cubrir formatos comunes (mp3, m4a, ogg, wav, aac)
	// y URL de streaming (ej: .com/download/episode/...) que apuntan al archivo.
	// También añadimos 'podtrac', 'megaphone' o 'anchor.fm' como indicadores de una URL de audio.
	const audioRegex =
		/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$|(\/download\/episode\/)/i;

	for (const link of links) {
		// Asegúrate de decodificar para manejar URLs complejas como las de Anchor/Megaphone
		const decoded = decodeURIComponent(link);

		// Criterios de coincidencia:
		if (
			// A) Coincide con una extensión de audio al final (con o sin parámetros de query)
			audioRegex.test(decoded) ||
			// B) Coincide con dominios conocidos que sirven audio directo
			decoded.includes("dts.podtrac.com") ||
			decoded.includes("traffic.megaphone.fm")
		) {
			return decoded; // Retorna la URL directa más única posible
		}
	}
	return null;
};