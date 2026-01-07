export interface HistorysResponse {
    meta: Meta;
    data: Datum[];
}

export enum Type {
    Podcast = "podcast",
    Radio = "radio",
}

export type EntityType = Type.Radio | Type.Podcast;



export interface Datum {
    id: string;
    userId: string;
    radioStation: RadioStation | null;
    radioStationId: null | string;
    podcast: Podcast | null;
    podcastId: null | string;
    type: Type;
    listenedAt: LastPlayed;
    lastPlayed: LastPlayed;
}

export interface LastPlayed { }
export interface ContactInfo { }

export interface Podcast {
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
    categories?: string[];
}





export interface HistoryQueryParameters {
    type: Type;
    page: number;
    limit: number;
    context: 'page'
}

export interface Meta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
}
