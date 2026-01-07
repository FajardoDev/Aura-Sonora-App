export interface PodcastResponse {
	meta: Meta;
	podcast: Podcasts[];
}

export interface Meta {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	limit: number;
	podcast: Podcasts[];
}

export interface Podcasts {
	id: string;
	titleEncabezado: string;
	slug: string;
	image: string;
	isAudiobook: boolean;
	titleSecond: string;
	description: string;
	categories: string[];
	links: Link[];
	isFavorite: boolean;
	isLiked: boolean;
	likesCount: number;
	lastPlayed: null;
	commentsCount: number;
	averageRating: number;
}

export interface Link {
	id: string;
	href: string;
	imgSrc: ImgSrc;
}

export enum ImgSrc {
	ImagesDonationPageSVG = "/images/donation-page.svg",
	ImagesEarthSVG = "/images/earth.svg",
	ImagesFeedSVG = "/images/feed.svg",
	ImagesLightningSVG = "/images/lightning.svg",
	ImagesPodlinkSVG = "/images/podlink.svg",
}

export type EntityType = "radio" | "podcast";
type ItemId = string;
type ItemSlug = string;

export interface RadioStationResponse {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	limit: number;
	stations: Station[];
}

export interface Station {
	id: string;
	slug: string;
	title: string;
	radioname: string;
	radioid: string;
	radioimg: string;
	stream: string;
	frecuencia: null;
	categories: string[];
	locations: string[];
	isFavorite: boolean;
	isLiked: boolean;
	likesCount: number;
	lastPlayed: null;
	commentsCount: number;
	averageRating: number;
}

export interface EntityDetail extends Station, Podcast {
	// Hereda  Station (id, isFavorite, etc.)
	type: EntityType; // Añadimos 'type' para que el hook sepa a qué lista actualizar.
}

export interface FavoriteTogglePayload {
	type: EntityType;
	radioStationId?: ItemId;
	radioSlug?: ItemSlug;
	podcastId?: ItemId;
	podcastSlug?: ItemSlug;
}
// source?: "detail" | 'favorites' | 'list', // ✅ nuevo
// export interface FavoriteTogglePayload {
//     type: EntityType;
//     radioStationId?: string; // Usado si type === 'radio'
//     podcastId?: string;      // Usado si type === 'podcast'
//     slug?: string;      // Usado si type === 'podcast'
// }

export interface FavoriteToggleResponse {
	isFavorite: boolean;
	message: string;
}

//! Inteface para GET Favoritos
export interface FavoriteListRespons {
	meta: {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};
	data: FavoriteEntity[];
}

export interface FavoriteEntity {
	id: string;
	userId: string;
	radioStation: Station | null; // radioStation:   RadioStation | null;
	radioStationId: null | string;
	podcast: Podcast | null;
	podcastId: null | string;
	type: EntityType;
	createdAt: Record<string, any>; // Tipo para el objeto de fecha
}

export interface Podcast {
	audioUrl: any;
	id: string;
	titleEncabezado: string;
	slug: string;
	image: string;
	titleSecond: string;
	description: string;
	categories: string[];
	isFavorite: boolean;
	isLiked: boolean;
	likesCount: number;
	commentsCount: number;
	averageRating: number;
	lastPlayed: null;
}

// Interfaz para la entidad aplanada que usará la UI (similar a EntityDetail pero más flexible)
export interface FlatFavoriteEntity extends Podcast, Station {
	type: EntityType;
}

export interface FavoriteQueryParameters {
	type: EntityType;
	page: number;
	limit: number;
}

export interface ParamsRadioStation {
	limit: number;
	page: number;
	search?: string;
}

export interface RadioStation {
	id: string;
	radioid: string;
	radioname: string;
	slug: string;
	radioimg: string;
	stream: string;
	streamtype: string;
	frecuencia: null;
	title: string;
	description: string;
	contact_info: ContactInfo;
	listeners: number;
	nowPlaying: null;
	isFavorite: boolean;
	isLiked: boolean;
	likesCount: number;
	commentsCount: number;
	averageRating: number;
	lastPlayed: null;
}

export interface ContactInfo {
	address: string;
	phone: string;
	website?: string;
	facebook?: string;
	twitter?: string;
	email?: string;
}
