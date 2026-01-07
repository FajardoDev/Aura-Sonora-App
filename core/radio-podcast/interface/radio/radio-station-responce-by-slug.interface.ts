export interface RadioStationResponseBySlug {
    data: Data;
    relatedStations: RelatedStations;
}

interface Detail {
    contact_info?: Record<string, any>
}

export interface Data {
    id: string;
    radioname: string;
    slug: string;
    radioid: string;
    radioimg: string;
    description: string;
    stream: string;
    streamtype: string;
    frecuencia: null;
    categories: string[];
    locations: string[];
    isFavorite: boolean;
    isLiked: boolean;
    likesCount: number;
    lastPlayed: null;
    commentsCount: number;
    averageRating: number;
    lastComments?: LastComment[];
    favoritesCount?: number;
    contact_info?: Detail; // Información de contacto adicional
}



export interface LastComment {
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
    radioStationId: string;
    podcastId: null;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    roles: string[];
    image: null;
}

export interface RelatedStations {
    title: string;
    description: string;
    page: number;
    limit: number;
    items: Data[];
}
