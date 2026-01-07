import { HistoryResponse } from "@/core/radio-podcast/interface/radio-podcast/history.interface";
import { QueryKey, useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchHistory } from "../actions/fetch-history.action";




// export interface FlatHistoryItems {
//     id: string;
//     type: "radio" | "podcast";
//     title: string;
//     subtitle?: string;
//     image?: string;
//     slug: string;
//     isFavorite: boolean;
//     isLiked: boolean;
//     likesCount: number;
//     commentsCount: number;
//     averageRating: number;
//     lastPlayed: any;
//     stream?: string;
// }

// export const transformHistoryDatas = ( data: HistoryResponse | undefined ): FlatHistoryItem[] => {
//     if ( !data ) return [];

//     const flatEntities: FlatHistoryItem[] = [];

//     data.radios.forEach( fav => {
//         if ( !fav.radioStation ) return;
//         flatEntities.push( {
//             id: fav.radioStation.id,
//             type: 'radio',
//             title: fav.radioStation.radioname,
//             subtitle: fav.radioStation.title,
//             image: fav.radioStation.radioimg,
//             slug: fav.radioStation.slug,
//             isFavorite: fav.radioStation.isFavorite,
//             isLiked: fav.radioStation.isLiked,
//             likesCount: fav.radioStation.likesCount,
//             commentsCount: fav.radioStation.commentsCount,
//             averageRating: fav.radioStation.averageRating,
//             lastPlayed: fav.lastPlayed,
//         } );
//     } );

//     data.podcasts.forEach( fav => {
//         if ( !fav.podcast ) return;
//         flatEntities.push( {
//             id: fav.podcast.id,
//             type: 'podcast',
//             title: fav.podcast.titleEncabezado,
//             subtitle: fav.podcast.titleSecond,
//             image: getImageUrl( fav.podcast.image ),
//             slug: fav.podcast.slug,
//             isFavorite: fav.podcast.isFavorite,
//             isLiked: fav.podcast.isLiked,
//             likesCount: fav.podcast.likesCount,
//             commentsCount: fav.podcast.commentsCount,
//             averageRating: fav.podcast.averageRating,
//             lastPlayed: fav.lastPlayed,
//         } );
//     } );

//     return flatEntities;
// };


export interface FlatHistoryEntity {
    id: string;
    type: 'radio' | 'podcast';
    slug: string;
    image?: string;
    title: string;
    subtitle?: string;
    stream?: string;
    radioname?: string;
    titleEncabezado?: string;
    isFavorite: boolean;
    isLiked: boolean;
    likesCount: number;
    commentsCount: number;
    averageRating: number;
    lastPlayed: any;
}

// export const transformHistoryData = ( data: HistoryResponse | undefined ): FlatHistoryEntity[] => {
//     if ( !data ) return [];

//     const flatEntities: FlatHistoryEntity[] = [];

//     // Radios
//     data.radios.forEach( ( fav: PodcastElement ) => {
//         if ( !fav.radioStation ) return;
//         const radio = fav.radioStation;
//         flatEntities.push( {
//             id: radio.id,
//             type: 'radio',
//             title: radio.radioname,
//             subtitle: radio.title,
//             image: radio.radioimg,
//             slug: radio.slug,
//             stream: radio.stream,
//             radioname: radio.radioname,
//             isFavorite: radio.isFavorite,
//             isLiked: radio.isLiked,
//             likesCount: radio.likesCount,
//             commentsCount: radio.commentsCount,
//             averageRating: radio.averageRating,
//             lastPlayed: fav.lastPlayed,
//         } );
//     } );

//     // Podcasts
//     data.podcasts.forEach( ( fav: PodcastElement ) => {
//         if ( !fav.podcast ) return;
//         const podcast = fav.podcast;
//         flatEntities.push( {
//             id: podcast.id,
//             type: 'podcast',
//             title: podcast.titleEncabezado,
//             subtitle: podcast.titleSecond,
//             image: podcast.image,
//             slug: podcast.slug,
//             titleEncabezado: podcast.titleEncabezado,
//             isFavorite: podcast.isFavorite,
//             isLiked: podcast.isLiked,
//             likesCount: podcast.likesCount,
//             commentsCount: podcast.commentsCount,
//             averageRating: podcast.averageRating,
//             lastPlayed: fav.lastPlayed,
//         } );
//     } );

//     return flatEntities;
// };


// 2. Función de Transformación (Refactorizada y tipada)
export const transformHistoryData = ( data: HistoryResponse ): FlatHistoryEntity[] => {
    const flatEntities: FlatHistoryEntity[] = [];

    // Radios
    ( data.radios ?? [] ).forEach( ( fav ) => {
        if ( !fav.radioStation ) return;
        const radio = fav.radioStation;
        flatEntities.push( {
            id: radio.id,
            type: 'radio',
            title: radio.radioname,
            subtitle: radio.title,
            image: radio.radioimg,
            slug: radio.slug,
            stream: radio.stream,
            radioname: radio.radioname,
            isFavorite: radio.isFavorite,
            isLiked: radio.isLiked,
            likesCount: radio.likesCount,
            commentsCount: radio.commentsCount,
            averageRating: radio.averageRating,
            lastPlayed: fav.lastPlayed,
            // Valores que no aplican para radio:
            titleEncabezado: undefined, 
        } );
    } );

    // Podcasts
    ( data.podcasts ?? [] ).forEach( ( fav ) => {
        if ( !fav.podcast ) return;
        const podcast = fav.podcast;
        flatEntities.push( {
            id: podcast.id,
            type: 'podcast',
            title: podcast.titleEncabezado,
            subtitle: podcast.titleSecond,
            image: podcast.image,
            slug: podcast.slug,
            titleEncabezado: podcast.titleEncabezado,
            isFavorite: podcast.isFavorite,
            isLiked: podcast.isLiked,
            likesCount: podcast.likesCount,
            commentsCount: podcast.commentsCount,
            averageRating: podcast.averageRating,
            lastPlayed: fav.lastPlayed,
            // Valores que no aplican para podcast:
            stream: undefined, 
            radioname: undefined,
        } );
    } );

    // Ordenar por lastPlayed (asumiendo que es un timestamp válido para ordenar)
    // flatEntities.sort((a, b) => (new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()));

    return flatEntities;
};

export const useHistory = () => {

    const HISTORY_KEY: QueryKey = ['history', 'home'];
    
    // Usamos el 'select' para transformar HistoryResponse a FlatHistoryEntity[]
    const historyQuery: UseQueryResult<FlatHistoryEntity[]> = useQuery({
        queryKey: HISTORY_KEY,
        queryFn: fetchHistory,
        
        // ** SOLUCIÓN ANTI-FALLO: SELECTOR INTERNO **
        select: (data: HistoryResponse) => {
            // TanStack Query solo re-renderizará si el resultado de 'select' cambia de referencia.
            // Nuestra función transformHistoryData ya devuelve una nueva matriz, lo que es suficiente.
            return transformHistoryData(data);
        },
        // ---------------------------------------------

        initialData: { radios: [], podcasts: [] }, // El initialData debe ser del tipo de retorno de queryFn
        initialDataUpdatedAt: () => 0, // Fuerza initialData a ser stale
    });

    // Dividimos las listas para el consumo del componente
    const radios = historyQuery.data?.filter( ( item ) => item.type === "radio" ) ?? [];
    const podcasts = historyQuery.data?.filter( ( item ) => item.type === "podcast" ) ?? [];

    return {
        historyQuery,
        radios,
        podcasts,
        isLoading: historyQuery.isLoading,
        isError: historyQuery.isError,
    };
};


// export const useHistorys = () => {

//      const HISTORY_KEY: QueryKey = ['history', 'home'];

//     const historyQuery = useQuery<HistoryResponse>( {

//         queryKey: HISTORY_KEY,
//         queryFn: fetchHistory,
//         // staleTime: 1000 * 60 * 5, // 5 minutos

//            // ** SOLUCIÓN ANTI-FALLO: SELECTOR INTERNO **
//         select: (data: HistoryResponse) => {
//             // TanStack Query solo re-renderizará si el resultado de 'select' cambia de referencia.
//             // Nuestra función transformHistoryData ya devuelve una nueva matriz, lo que es suficiente.
//             return transformHistoryData(data);
//         },

//         // Si el usuario no tiene historial, devolvemos un objeto vacío para evitar errores
//         initialData: { radios: [], podcasts: [] },
//     } );

    
   

//     // Opcionalmente, puedes ordenar 'allHistory' por la fecha 'listenedAt' o 'lastPlayed'
//     // si esa propiedad contuviera un timestamp útil.

//     return {
//         historyQuery,
//         // Datos combinados de radio y podcast para un FlatList horizontal
    
//         isLoading: historyQuery.isLoading,
//         isError: historyQuery.isError,
//     };
// };
