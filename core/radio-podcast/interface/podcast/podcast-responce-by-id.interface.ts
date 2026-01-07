export interface PodcastIDResponse {
    podcast: Podcast;
    relatedPodcast: RelatedPodcast;
}

export interface Podcast {
    id: string;
    titleEncabezado: string;
    slug: string;
    image: string;
    titleSecond: string;
    description: string;
    categories: string[];
    links: Link[];
    isFavorite: boolean;
    isLiked: boolean;
    likesCount?: number;
    lastPlayed: null;
    commentsCount: number;
    averageRating: number;
    lastComment?: LastComment[];
    favoritesCount?: number;
}

export interface LastComment {
    id: string;
    content: string;
    rating: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
    radioStationId: null;
    podcastId: string;
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    roles: string[];
    image: null;
}

export interface Link {
    id: string;
    href: string;
    imgSrc: string;
}

export interface RelatedPodcast {
    title: string;
    description: string;
    page: number;
    limit: number;
    items: Podcast[];
}
