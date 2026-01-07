


import { fetchRadiosByCategory } from "@/core/radio-podcast/actions/radio/fetch-radio-by-category.action";
import { useInfiniteQuery, } from "@tanstack/react-query";

// staleTime: 1000 * 60 * 60 * 24,  24h || 5 * 60 * 1000 5 minutos 
const ITEMS_PER_PAGE = 20;

export const useRadioCategory = ( category: string ) => {

    const queryKey = ['radioscat', 'infinite', category];

    const RadioCategoryQuery = useInfiniteQuery( {
        queryKey: queryKey,
        queryFn: ( { pageParam = 1 } ) =>
            fetchRadiosByCategory( pageParam, ITEMS_PER_PAGE, category ),
        enabled: !!category, // ✅ no hace la query hasta que el ID exista
        staleTime: 1000 * 60 * 60, //1hora

        initialPageParam: 1,

        getNextPageParam: ( lastPage ) => {
            // Aseguramos que 'meta' exista antes de intentar acceder a sus propiedades
            if ( lastPage.meta && lastPage.meta.currentPage < lastPage.meta.totalPages ) {
                return lastPage.meta.currentPage + 1;
            }

            // Si no hay más páginas, devolvemos undefined.
            return undefined;
        },
    } )


    return {
        RadioCategoryQuery,

        // methods
        loadNextPage: RadioCategoryQuery.fetchNextPage,
        isFetching: RadioCategoryQuery.isFetching,
        hasNextPage: RadioCategoryQuery.hasNextPage,


    }
}
