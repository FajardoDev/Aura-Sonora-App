import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { getFavorites } from "../actions/radio-podcast/actions/post-toggle-favorites.action";
import { EntityType, Podcast } from "../interface/radio-podcast/historys.interface";
import { FavoriteEntity, FavoriteListRespons, FlatFavoriteEntity, Station } from "../interface/radio/radio-station-responce.interface";


const ITEMS_PER_PAGE = 21; // Mantenemos la misma constante de paginación que en useRadioStation

// Función auxiliar para aplanar y transformar los datos anidados
const transformFavoriteData = ( data: FavoriteListRespons | undefined ): FlatFavoriteEntity[] => {
    if ( !data ) return [];

    // Mapeamos cada registro de favorito (FavoriteEntity) en un FlatFavoriteEntity usable.
    const flatEntities: FlatFavoriteEntity[] = data.data.map( ( favEntity: FavoriteEntity ) => {
        const sourceData = favEntity.type === 'radio' ? favEntity.radioStation : favEntity.podcast;

        if ( !sourceData ) {
            // Esto no debería pasar si el backend está bien, pero es buena práctica cubrirlo.
            console.error( 'Error: Entidad favorita no encontrada en el registro.', favEntity );
            // Creamos un objeto parcial para evitar fallos de renderizado
            return { id: favEntity.id, type: favEntity.type } as FlatFavoriteEntity;
        }

        // Unificamos las propiedades de Station y Podcast
        const entity: Partial<FlatFavoriteEntity> = {
            id: sourceData.id,
            type: favEntity.type,
            isFavorite: sourceData.isFavorite,
            isLiked: sourceData.isLiked,
            likesCount: sourceData.likesCount,
            commentsCount: sourceData.commentsCount,
            averageRating: sourceData.averageRating,
            lastPlayed: sourceData.lastPlayed,
            slug: sourceData.slug,


        };

        if ( favEntity.type === 'radio' ) {
            const radio = sourceData as Station;
            Object.assign( entity, {
                radioname: radio.radioname,
                radioid: radio.radioid,
                radioimg: radio.radioimg,
                slug: radio.slug,
                stream: radio.stream,
                frecuencia: radio.frecuencia,
                categories: radio.categories,
                locations: radio.locations,
                // Aseguramos que los campos de podcast sean undefined
                titleEncabezado: undefined,
                image: undefined,
                titleSecond: undefined,
                description: undefined,


            } );
        } else { // type === 'podcast'
            const podcast = sourceData as Podcast;
            Object.assign( entity, {
                titleEncabezado: podcast.titleEncabezado,
                image: podcast.image,
                titleSecond: podcast.titleSecond,
                slug: podcast.slug,
                description: podcast.description,
                categories: podcast.categories,
                // Aseguramos que los campos de radio sean undefined
                radioname: undefined,
                radioid: undefined,
                radioimg: undefined,
                stream: undefined,
                frecuencia: undefined,
                locations: undefined,
            } );
            // Categories es común, pero lo asignamos si no existe en radio
            if ( podcast.categories ) {
                entity.categories = podcast.categories;
            }
        }

        return entity as FlatFavoriteEntity;
    } );

    return flatEntities;
};

/**
 * Hook para obtener la lista de favoritos (radios o podcasts) con paginación infinita.
 * */
export const useFetchFavorites = ( entityType: EntityType ) => {
    // const queryClient = useQueryClient();

    const favoriteQuery = useInfiniteQuery<
        FavoriteListRespons, // Tipo de respuesta que viene del fetcher
        Error,
        InfiniteData<FlatFavoriteEntity[]> // Tipo de data después de la transformación (select)
    >( {
        // La queryKey debe cambiar si cambia el tipo ('radio' o 'podcast')
        queryKey: ['favorites', 'infinite', entityType],

        queryFn: ( { pageParam = 1 } ) =>
            getFavorites( {
                type: entityType,
                page: pageParam as number,
                limit: ITEMS_PER_PAGE,
            } ),

        staleTime: 1000 * 60 * 60, // 1 hora de stale time

        initialPageParam: 1,

        getNextPageParam: ( lastPage ) => {
            if ( lastPage.meta.page < lastPage.meta.totalPages ) {
                return lastPage.meta.page + 1;
            }
            // Si no hay más páginas, devolvemos `undefined`.
            return undefined;
        },

        // 💡 Función SELECT: Aplana la estructura de paginación y transforma los datos
        select: ( data ) => ( {
            pages: data.pages.map( page => transformFavoriteData( page ) ),
            pageParams: data.pageParams,
        } ),
    } );

    const allFavorites: FlatFavoriteEntity[] =
        favoriteQuery.data?.pages.flatMap( ( page ) => page ) ?? [];

    return {
        favoriteQuery,
        allFavorites, // Lista plana y unificada de favoritos para la FlatList

        // methods
        loadNextPage: favoriteQuery.fetchNextPage,
        hasNextPage: favoriteQuery.hasNextPage,
        isSearching: favoriteQuery.isFetching && favoriteQuery.dataUpdatedAt === 0,
    };
};