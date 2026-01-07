import { Datum, EntityType, HistoryQueryParameters, HistorysResponse, Podcast, RadioStation, Type } from "@/core/radio-podcast/interface/radio-podcast/historys.interface";
import { InfiniteData, QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { fetchHistorys } from "../actions/fetch-history.action";

export interface FlatHistoryEntityPage {
    id: string; // ID del registro de historial (Datum.id)
    entityId: string; // ID de la Radio/Podcast
    type: EntityType;
    slug: string;
    isFavorite: boolean;
    isLiked: boolean;
    likesCount: number;
    commentsCount: number;
    averageRating: number;

    // Propiedades de visualización unificadas
    image: string;
    titleEncabezado: string; // Título principal
    subtitle: string;       // Subtítulo
    description: string;
    categories: string[];

    // Específico de Radio
    stream?: string;
    radioname?: string;
}

// Función auxiliar para aplanar y transformar los datos anidados
const transformHistoryDataPage = ( pageData: HistorysResponse ): FlatHistoryEntityPage[] => {
    if ( !pageData || !pageData.data ) return [];

    return pageData.data.map( ( favEntity: Datum ) => {
        const isRadio = favEntity.type === Type.Radio;
        const sourceData = isRadio ? favEntity.radioStation : favEntity.podcast;

        if ( !sourceData ) {
            // Saltamos el elemento si no hay datos anidados, indicando un error en el backend
            console.warn( `Registro de historial sin entidad anidada para tipo ${favEntity.type}. Saltando...` );
            return null;
        }

        // CORRECCIÓN 1 aplicada: 'categories' se accede de forma segura en 'commonProps'
        const entityCategories = isRadio
            ? ( sourceData as RadioStation ).categories || []
            : ( sourceData as Podcast ).categories;

        const commonProps = {
            id: favEntity.id, // ID del registro de historial
            entityId: sourceData.id, // ID de la entidad (Radio/Podcast)
            type: favEntity.type,
            slug: sourceData.slug,
            isFavorite: sourceData.isFavorite,
            isLiked: sourceData.isLiked,
            likesCount: sourceData.likesCount,
            commentsCount: sourceData.commentsCount,
            averageRating: sourceData.averageRating,
            description: sourceData.description || '',
            categories: entityCategories || [], // Usamos el valor seguro
            // categories: (sourceData as RadioStation | Podcast).categories || [], // Agregado cast para tipar categories
        };

        if ( isRadio ) {
            const radio = sourceData as RadioStation;
            return {
                ...commonProps,
                image: radio.radioimg,
                titleEncabezado: radio.radioname, // Título principal
                subtitle: radio.title,           // Subtítulo
                stream: radio.stream,
                radioname: radio.radioname,
            } as FlatHistoryEntityPage;

        } else { // Type.Podcast
            const podcast = sourceData as Podcast;
            return {
                ...commonProps,
                image: podcast.image,
                titleEncabezado: podcast.titleEncabezado, // Título principal
                subtitle: podcast.titleSecond,             // Subtítulo
                stream: undefined,
                radioname: undefined,
            } as FlatHistoryEntityPage;
        }
    } ).filter( ( item ): item is FlatHistoryEntityPage => item !== null ); // Filtra los nulos
};


const ITEMS_PER_PAGE = 21;
// Definimos el tipo de dato que devuelve el 'select'
type TransformedData = InfiniteData<FlatHistoryEntityPage[]>;

export const useHistoryPage = ( entityType: EntityType ) => {

    const HISTORY_KEY: QueryKey = ['historys', 'page', entityType];

    const historysQuery = useInfiniteQuery<
        HistorysResponse,         // TQueryFnData: Lo que fetchHistorys devuelve
        Error,                    // TError: El tipo de error
        // 🛑 SOLUCIÓN: TData ahora coincide con el tipo EXACTO que devuelve 'select'
        InfiniteData<FlatHistoryEntityPage[], number>,
        QueryKey,                 // TQueryKey: El tipo de la clave de la query
        number                    // TPageParam: El tipo de pageParam (1, 2, 3...)
    >
        ( {
            queryKey: HISTORY_KEY,
            queryFn: ( { pageParam = 1 } ) => {
                // Aseguramos que los parámetros se construyan correctamente
                const params: HistoryQueryParameters = {
                    page: pageParam as number,
                    limit: ITEMS_PER_PAGE,
                    type: entityType,
                    context: 'page'
                };
                return fetchHistorys( params );
            },

            // Define el número de la próxima página a cargar.
            initialPageParam: 1,
            getNextPageParam: ( lastPage ) => {
                const { page, totalPages } = lastPage.meta;
                if ( page < totalPages ) {
                    return page + 1;
                }
                // Si no hay más páginas, devolvemos undefined.
                return undefined;
            },

            // Mapeamos cada página del array pages
            select: ( data ) => ( {
                pages: data.pages.map( page => transformHistoryDataPage( page ) ),
                pageParams: data.pageParams
            } ),

            staleTime: 1000 * 60 * 5, // Los datos se consideran 'frescos' por 5 minutos
        } );

    // 🌟 Generamos una lista plana de TODOS los elementos cargados hasta ahora
    const allHistorys: FlatHistoryEntityPage[] =
        historysQuery.data?.pages.flatMap( ( page ) => page ) ?? [];

    return {
        // La lista plana de entidades
        allHistorys,
        historysQuery,

        // Métodos de Infinite Query
        loadNextPage: historysQuery.fetchNextPage,

        // Estados principales
        isLoading: historysQuery.isLoading,
        isFetchingNextPage: historysQuery.isFetchingNextPage, // Útil para mostrar un spinner al hacer scroll
        hasNextPage: historysQuery.hasNextPage,
        isError: historysQuery.isError,
    };
};
