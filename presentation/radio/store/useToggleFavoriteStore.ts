import { togglefavorite } from '@/core/radio-podcast/actions/radio-podcast/actions/post-toggle-favorites.action';
import { getKeys } from '@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite';
import { Data as DetailData, RadioStationResponseBySlug } from '@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface';
import { FavoriteEntity, FavoriteTogglePayload, Podcast, PodcastResponse, RadioStationResponse, Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { InfiniteData, QueryClient } from "@tanstack/react-query";
import { create } from 'zustand';

// Definimos los tipos de datos que TQ maneja para las listas
type EntityItem = Station | Podcast;
type DetailCacheType = RadioStationResponseBySlug; // La estructura completa del detalle
type RadioInfiniteData = InfiniteData<RadioStationResponse>;
type PodcastInfiniteData = InfiniteData<PodcastResponse>;
type FavoriteListInfiniteData = InfiniteData<{ data: FavoriteEntity[], meta: any }>;


interface FavoriteStore {
    isLoading: boolean;
    error: string | null;
    toggleFavoriteAction: ( payload: FavoriteTogglePayload, queryClient: QueryClient ) => Promise<void>;
}

export const useToggleFavoriteStore = create<FavoriteStore>()( ( set, get ) => ( {
    isLoading: false,
    error: null,


    toggleFavoriteAction: async ( payload: FavoriteTogglePayload, queryClient: QueryClient ) => {
        set( { isLoading: true, error: null } );

        const { type: entityType, radioSlug, podcastSlug } = payload;
        const entitySlug = radioSlug || podcastSlug; // El slug del ítem que estamos toggleando

        if ( !entitySlug ) {
            set( { isLoading: false, error: "Falta el slug para identificar la entidad." } );
            return;
        }

        const { listQueryKey, favoritesQueryKey, detailBaseKey, entityArrayKey } = getKeys( entityType );

        // La clave de caché que contiene la data principal Y las relacionadas
        const detailQueryKey = [detailBaseKey[0], entitySlug];

        // -------------------------------------------------------------
        // 1. MUTACIÓN OPTIMISTA (Patching Anidado)
        // -------------------------------------------------------------

        // Obtenemos la data actual del objeto raíz (RadioStationResponseBySlug)
        const previousDetailData = queryClient.getQueryData<DetailCacheType>( detailQueryKey );

        // El estado de favorito está en el objeto 'data' principal
        const newFavoriteStatus = previousDetailData
            ? !previousDetailData.data.isFavorite
            : true;

        // --- Parcheamos el DETALLE COMPLETO (Raíz) ---
        queryClient.setQueryData<DetailCacheType>(
            detailQueryKey,
            ( oldData ) => {
                if ( !oldData ) return oldData;

                // 1. Actualizar el ítem principal
                const updatedMainData: DetailData = {
                    ...oldData.data,
                    isFavorite: newFavoriteStatus,
                };

                // 2. Actualizar la lista de relacionadas (RelatedStations)
                const updatedRelatedItems = oldData.relatedStations.items.map( item =>
                    // Si el SLUG del ítem relacionado coincide con el SLUG del que se hizo toggle
                    item.slug === entitySlug
                        ? { ...item, isFavorite: newFavoriteStatus } as DetailData
                        : item
                );

                // 3. Reconstruir el objeto de caché completo
                return {
                    ...oldData,
                    data: updatedMainData,
                    relatedStations: {
                        ...oldData.relatedStations,
                        items: updatedRelatedItems,
                    }
                } as DetailCacheType;
            }
        );

        try {
            // -------------------------------------------------------------
            // 2. LLAMADA A LA API
            // -------------------------------------------------------------
            await togglefavorite( payload ); // TU FUNCIÓN REAL

            // -------------------------------------------------------------
            // 3. SINCRONIZACIÓN POST-API
            // -------------------------------------------------------------

            // A. Anti-Salto: Patch la LISTA PRINCIPAL (Stations/Podcasts)
            // (Esta parte es opcional si el usuario no tiene la lista principal abierta, 
            // pero se mantiene por coherencia)
            queryClient.setQueryData<RadioInfiniteData | PodcastInfiniteData>(
                listQueryKey,
                ( oldData ) => {
                    if ( !oldData ) return oldData;
                    const newPages = oldData.pages.map( page => {
                        const entities = ( page as any )[entityArrayKey] as EntityItem[] | undefined;
                        if ( !entities ) return page;
                        const updatedEntities = entities.map( item =>
                            item.slug === entitySlug
                                ? { ...item, isFavorite: newFavoriteStatus } as EntityItem
                                : item
                        );
                        return { ...page, [entityArrayKey]: updatedEntities };
                    } );
                    return { ...oldData, pages: newPages } as any;
                }
            );

            // B. Coherencia Total: Patch la LISTA DE FAVORITOS (Añadir/Quitar)
            const itemToToggle = previousDetailData?.data; // Usamos la data del detalle que ya tenemos

            queryClient.setQueryData<FavoriteListInfiniteData>(
                favoritesQueryKey,
                ( oldData ) => {
                    if ( !oldData || !itemToToggle ) return oldData;

                    const favoriteEntity: FavoriteEntity = {
                        id: itemToToggle.id,
                        userId: '',
                        radioStation: entityType === 'radio' ? itemToToggle as Station : null,
                        radioStationId: entityType === 'radio' ? itemToToggle.id : null,
                        podcast: entityType === 'podcast' ? itemToToggle as unknown as Podcast : null,
                        podcastId: entityType === 'podcast' ? itemToToggle.id : null,
                        type: entityType,
                        createdAt: {},
                    };

                    const firstPage = oldData.pages[0];
                    const existingData = firstPage?.data || [];

                    if ( newFavoriteStatus === false ) { // Eliminar de favoritos
                        const newPages = oldData.pages.map( page => ( {
                            ...page,
                            data: page.data.filter( fav => {
                                const slug = fav.radioStation?.slug || fav.podcast?.slug;
                                return slug !== entitySlug;
                            } ),
                        } ) );
                        return { ...oldData, pages: newPages };

                    } else { // Añadir a favoritos
                        if ( !existingData.some( fav => ( fav.radioStation?.slug || fav.podcast?.slug ) === entitySlug ) ) {
                            const updatedFirstPage = {
                                ...firstPage,
                                data: [favoriteEntity, ...existingData],
                            };
                            return { ...oldData, pages: [updatedFirstPage, ...oldData.pages.slice( 1 )] };
                        }
                    }
                    return oldData;
                }
            );

            // C. Invalida la búsqueda por SLUG
            // Si el backend tiene lógica de reordenamiento/filtrado en los relacionados
            // (que causaría el salto), la invalidación garantiza que el próximo fetch
            // obtenga el orden correcto.
            queryClient.invalidateQueries( { queryKey: detailQueryKey } );

            set( { isLoading: false } );

        } catch ( error ) {
            console.error( "Error al mutar favorito:", error );

            // -------------------------------------------------------------
            // 4. Rollback (Revertimos el objeto de caché completo)
            // -------------------------------------------------------------
            if ( previousDetailData ) {
                queryClient.setQueryData( detailQueryKey, previousDetailData );
            }

            set( { isLoading: false, error: "Ocurrió un error al actualizar el favorito." } );
        }
    },

} ) )