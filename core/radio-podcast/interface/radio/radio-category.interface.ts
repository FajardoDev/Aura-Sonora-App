export interface RadioCategoryResponse {
    meta: Meta;
    data: Datum[];
}

export interface Datum {
    id: string;
    radioname: string;
    slug: string;
    radioid: string;
    radioimg: string;
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
}

export interface Meta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    category: string;
}
