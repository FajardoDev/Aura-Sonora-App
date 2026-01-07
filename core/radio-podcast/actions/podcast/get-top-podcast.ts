import { radioPodcastApi } from "@/core/api/radioPodcastApi";

export interface TopPodcastResponse {
	id: string;
	titleEncabezado: string;
	slug: string;
	image: string;
	titleSecond: string;
	description: string;
	categories: string[];
	links: Link[];
	commentsCount: number;
	averageRating: number;
	likesCount: number;
	isFavorite: boolean;
}

export interface Link {
	id: string;
	href: string;
	imgSrc: ImgSrc;
}

export enum ImgSrc {
	ImagesEarthSVG = "/images/earth.svg",
	ImagesFeedSVG = "/images/feed.svg",
	ImagesLightningSVG = "/images/lightning.svg",
	ImagesPodlinkSVG = "/images/podlink.svg",
}

export const getTopPodcast = async (): Promise<TopPodcastResponse> => {
	try {
		const { data } =
			await radioPodcastApi.get<TopPodcastResponse>("/podcastrd/top");

		return data;
	} catch (error) {
		console.log("❌ Error al obtener Top 9 podcasts Más Populares:", error);
		throw new Error("No se pudo obtener los podcasts Populares.");
	}
};
