export interface HistoryResponse {
    radios: PodcastElement[];
    podcasts: PodcastElement[];
}

export interface PodcastElement {
    id: string;
    userId: string;
    radioStationId: null | string;
    podcast?: PodcastPodcast;
    podcastId: null | string;
    type: string;
    listenedAt: LastPlayed;
    lastPlayed: LastPlayed;
    radioStation?: RadioStation;
}

export interface LastPlayed {
}

export interface PodcastPodcast {
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
}

export interface ContactInfo {
    address: string;
    phone: string;
    email: string;
    website?: string;
    facebook?: string;
    twitter?: string;
}
