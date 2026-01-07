export interface PodcastEpisodesResponse {
	podcastId: string;
	page: number;
	limit: number;
	totalItems: number;
	totalPages: number;
	episodes: Episode[];
}

export interface Episode {
	id: string;
	episodeTitle: string;
	slug: string;
	episodeDate: string; // ← viene como texto del backend
	episodeDescription: string;
	image: string;
	duration: string;
	links: string[];
	podcast: Podcast;
}

export interface Podcast {
	id: string;
	titleEncabezado: string;
	slug: string;
	image: string;
	titleSecond: string;
	description: string;
	categories: string[];
}
