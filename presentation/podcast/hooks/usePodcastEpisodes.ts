
import { fetchPodcastsEpisodes } from "@/core/radio-podcast/actions/podcast/get-podcast-episodes.action";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

// staleTime: 1000 * 60 * 60 * 24,  24h || 5 * 60 * 1000 5 minutos 
const ITEMS_PER_PAGE = 10;

export const usePodcastEpisodes = ( podcastId: string ) => {

    const queryClient = useQueryClient();
    const queryKey = ['episodes', 'infinite', podcastId];

    const podcastEpisodesQuery = useInfiniteQuery( {
        queryKey: queryKey,
        queryFn: ( { pageParam = 1 } ) =>
            fetchPodcastsEpisodes( pageParam, ITEMS_PER_PAGE, podcastId ),
        enabled: !!podcastId, // ✅ no hace la query hasta que el ID exista
        staleTime: 1000 * 60 * 60, //1hora

        initialPageParam: 1,
        getNextPageParam: ( lastPage ) => {
            const nextPage =
                lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
            return nextPage;
        },

        // Lógica para CARGAR MENOS (Página anterior)
        getPreviousPageParam: ( firstPage ) => {
            // Si la página actual es mayor a 1, podemos ir a la anterior.
            const previousPage = firstPage.page > 1 ? firstPage.page - 1 : undefined;
            return previousPage;
        },

    } )

    // --- Lógica para "Cargar Menos" (Remover la última página cargada) ---

    const loadPreviousPage = () => {

        const currentData = podcastEpisodesQuery.data;// Obtenemos caché

        if ( !currentData ) return;

        if ( currentData.pages.length <= 1 ) return; // Si solo hay un page no podemos eliminar

        // Escribimos la nueva data en la caché usando la 'queryKey' definida
        const newPages = currentData.pages.slice( 0, currentData.pages.length - 1 );

        queryClient.setQueryData( queryKey, { // ¡Usamos la constante queryKey definida!
            ...currentData,
            pages: newPages,
        } );
    };

    return {
        podcastEpisodesQuery,

        // methods
        loadNextPage: podcastEpisodesQuery.fetchNextPage,
        loadPreviousPage: loadPreviousPage, // Exportamos la nueva función
        isFetching: podcastEpisodesQuery.isFetching,
        hasNextPage: podcastEpisodesQuery.hasNextPage,

        // Verificamos si podemos "Cargar Menos" (Si hay más de 1 página cargada)
        hasPreviousPage: podcastEpisodesQuery.data
            ? podcastEpisodesQuery.data.pages.length > 1
            : false,
    }
}
