export interface PodcastCategoryResponse {
    meta: Meta;
    data: Datum[];
}

export interface Datum {
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

export interface Meta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    category: string;
}
