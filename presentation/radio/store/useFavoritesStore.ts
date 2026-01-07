

// import { queryClient } from "@/app/_layout";
import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { queryClient } from "@/core/query-client/queryClient";
import { getFavorites, togglefavorite } from "@/core/radio-podcast/actions/radio-podcast/actions/post-toggle-favorites.action";
import { EntityType, FavoriteEntity, FavoriteTogglePayload } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { create } from "zustand";
// import { persist } from "zustand/middleware";




interface FavoritesState {
    favorites: FavoriteEntity[];
    isLoading: boolean;
    error: string | null;

    fetchFavorites: ( type?: EntityType ) => Promise<void>;
    toggleFavorite: ( payload: FavoriteTogglePayload ) => Promise<void>;
    removeFavorite: ( type: EntityType, id: string ) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()( ( set, get ) => ( {
    favorites: [],
    isLoading: false,
    error: null,

    // 🔹 CARGAR FAVORITOS (solo para inicialización)
    fetchFavorites: async ( type?: EntityType ) => {
        try {
            set( { isLoading: true } );
            const res = await getFavorites( {
                type: type ?? "radio",
                page: 1,
                limit: 50,
            } );

            set( {
                favorites: res.data.map( ( f ) => ( {
                    ...f,
                    type: f.type,
                    radioStationId: f.radioStation?.id ?? f.radioStationId ?? null,
                    podcastId: f.podcast?.id ?? f.podcastId ?? null,
                } ) ),
                isLoading: false,
            } );
        } catch ( err: any ) {
            console.error( "❌ Error al cargar favoritos:", err );
            set( { error: err.message, isLoading: false } );
        }
    },

    // 🔹 TOGGLE FAVORITE (optimista y sin invalidar todo)
    // toggleFavorite: async ( payload: FavoriteTogglePayload ) => {
    //     try {
    //         const entityType = payload.type;
    //         const queryKey = ["favorites", "infinite", entityType];
    //         const { favorites } = get();

    //         // 1️⃣ Optimismo local en Zustand (reflejo instantáneo)
    //         const isAlreadyFav = favorites.some(
    //             ( f ) =>
    //                 ( entityType === "radio" && f.radioStationId === payload.radioStationId ) ||
    //                 ( entityType === "podcast" && f.podcastId === payload.podcastId )
    //         );

    //         set( {
    //             favorites: isAlreadyFav
    //                 ? favorites.filter(
    //                     ( f ) =>
    //                         !(
    //                             ( entityType === "radio" && f.radioStationId === payload.radioStationId ) ||
    //                             ( entityType === "podcast" && f.podcastId === payload.podcastId )
    //                         )
    //                 )
    //                 : [
    //                     ...favorites,
    //                     {
    //                         ...payload,
    //                         createdAt: new Date().toISOString(),
    //                     } as FavoriteEntity,
    //                 ],
    //         } );

    //         // 2️⃣ Actualiza la cache de React Query (sin refetch)
    //         queryClient.setQueryData( queryKey, ( oldData: any ) => {
    //             if ( !oldData ) return oldData;

    //             const updatedPages = oldData.pages.map( ( page: any, i: number ) =>
    //                 i === 0
    //                     ? isAlreadyFav
    //                         ? page.filter(
    //                             ( f: any ) =>
    //                                 !(
    //                                     ( entityType === "radio" && f.radioStationId === payload.radioStationId ) ||
    //                                     ( entityType === "podcast" && f.podcastId === payload.podcastId )
    //                                 )
    //                         )
    //                         : [
    //                             {
    //                                 ...payload,
    //                                 createdAt: new Date().toISOString(),
    //                             },
    //                             ...page,
    //                         ]
    //                     : page
    //             );

    //             return { ...oldData, pages: updatedPages };
    //         } );

    //         // 3️⃣ Llamada real al backend
    //         await togglefavorite( payload );
    //     } catch ( err ) {
    //         console.error( "⚠️ Error al hacer toggle:", err );
    //     }
    // },

    toggleFavorite: async ( payload: FavoriteTogglePayload ) => {
        try {
            const { favorites } = get();
            const entityType = payload.type;

            // Evitar spam de clics: si ya está en proceso, corta (puedes implementar un loadingMap más adelante)
            // --- snapshot para rollback ---
            const snapshot = [...favorites];

            const isAlreadyFav = favorites.some(
                ( f ) =>
                    ( entityType === "radio" && f.radioStationId === payload.radioStationId ) ||
                    ( entityType === "podcast" && f.podcastId === payload.podcastId )
            );

            if ( isAlreadyFav ) {
                // Optimistic remove
                set( {
                    favorites: favorites.filter(
                        ( f ) =>
                            !(
                                ( entityType === "radio" && f.radioStationId === payload.radioStationId ) ||
                                ( entityType === "podcast" && f.podcastId === payload.podcastId )
                            )
                    ),
                } );
            } else {
                // Construir un FavoriteEntity completo (temporal) — cumple la interfaz
                const newFavorite: FavoriteEntity = {
                    id: payload.radioStationId ?? payload.podcastId ?? `tmp-${Date.now()}`,
                    userId: /* obtén userId desde tu auth store o pon 'local-temp' */ "local-temp",
                    type: entityType,
                    radioStation: null, // si tienes data de la card, aquí puedes colocar el objeto completo
                    podcast: null,
                    radioStationId: payload.radioStationId ?? null,
                    podcastId: payload.podcastId ?? null,
                    createdAt: { iso: new Date().toISOString() }, // Record<string, any>
                };

                set( {
                    favorites: [...favorites, newFavorite],
                } );

                // También actualizamos React Query cache (opcional / recomendado)
                const favKey = ["favorites", "infinite", entityType];
                queryClient.setQueryData( favKey, ( oldData: any ) => {
                    if ( !oldData ) return oldData;
                    const updatedPages = oldData.pages.map( ( page: any, idx: number ) =>
                        idx === 0 ? [newFavorite, ...page] : page
                    );
                    return { ...oldData, pages: updatedPages };
                } );
            }

            // Llamada real al backend
            const res = await togglefavorite( payload );

            console.log( res );

            // Si backend devuelve alguna lista o estado final, sincroniza (opcional)
            // if (res?.favorites) set({ favorites: res.favorites });

            // Si backend indica que NO se pudo (o isFavorite es false y nosotros lo agregamos), podrías hacer rollback:
            // ejemplo: if (!res.isFavorite && !isAlreadyFav) { set({ favorites: snapshot }); }
        } catch ( err ) {
            console.error( "⚠️ Error en toggleFavorite, hago rollback:", err );
            // rollback ante error
            // set({ favorites: snapshot });
        }
    },



    // 🔹 ELIMINAR FAVORITO DESDE LA PÁGINA DE FAVORITOS
    removeFavorite: async ( type: EntityType, id: string ) => {
        try {
            const isRadio = type === "radio";
            const payload: FavoriteTogglePayload = {
                type,
                radioStationId: isRadio ? id : undefined,
                podcastId: !isRadio ? id : undefined,
            };

            await togglefavorite( payload ); // tu API ya maneja toggle

            set( {
                favorites: get().favorites.filter(
                    ( f ) =>
                        !(
                            ( isRadio && f.radioStationId === id ) ||
                            ( !isRadio && f.podcastId === id )
                        )
                ),
            } );

            // ⚡ También actualiza la cache de React Query
            queryClient.setQueryData( ["favorites", "infinite", type], ( oldData: any ) => {
                if ( !oldData ) return oldData;
                const updatedPages = oldData.pages.map( ( page: any ) =>
                    page.filter(
                        ( f: any ) =>
                            !(
                                ( isRadio && f.radioStationId === id ) ||
                                ( !isRadio && f.podcastId === id )
                            )
                    )
                );
                return { ...oldData, pages: updatedPages };
            } );

            console.log( "✅ Favorito eliminado correctamente:", payload );
        } catch ( err: any ) {
            console.error( "⚠️ Error al eliminar favorito:", err.message );
        }
    },
} ) );


interface FavoritesStates {
    favorites: FavoriteEntity[];
    isLoading: boolean;
    error: string | null;

    fetchFavorites: ( type?: EntityType ) => Promise<void>;
    toggleFavorite: ( payload: FavoriteTogglePayload ) => Promise<void>;
    removeFavorite: ( type: EntityType, id: string ) => Promise<void>;
}

export const useFavoritesStores = create<FavoritesStates>()(

    ( set, get ) => ( {
        favorites: [],
        isLoading: false,
        error: null,

        fetchFavorites: async ( type?: EntityType ) => {
            try {
                set( { isLoading: true } );
                const res = await getFavorites( {
                    type: type ?? "radio",
                    page: 1,
                    limit: 50,
                } );

                // set( { favorites: res.data, isLoading: false } );

                set( {
                    favorites: res.data.map( f => ( {
                        ...f,
                        type: f.type,
                        radioStationId: f.radioStation?.id ?? f.radioStationId ?? null,
                        podcastId: f.podcast?.id ?? f.podcastId ?? null,

                    } ) ),
                    isLoading: false,
                } )

            } catch ( err: any ) {
                console.error( "❌ Error al cargar favoritos:", err );
                set( { error: err.message, isLoading: false } );
            }
        },


        toggleFavorite: async ( payload: FavoriteTogglePayload ) => {
            try {
                const { favorites } = get();

                // 1️⃣ Detecta si ya es favorito
                const isAlreadyFav =
                    favorites.some(
                        ( f ) =>
                            ( payload.type === "radio" && f.radioStationId === payload.radioStationId ) ||
                            ( payload.type === "podcast" && f.podcastId === payload.podcastId )
                    );

                // 2️⃣ Actualiza optimísticamente el estado
                if ( isAlreadyFav ) {
                    set( {
                        favorites: favorites.filter(
                            ( f ) =>
                                !(
                                    ( payload.type === "radio" && f.radioStationId === payload.radioStationId ) ||
                                    ( payload.type === "podcast" && f.podcastId === payload.podcastId )
                                )
                        ),
                    } );
                } else {
                    set( {
                        favorites: [
                            ...favorites,
                            {
                                // id: crypto.randomUUID(), // temporal, si quieres
                                type: payload.type,
                                radioStationId: payload.radioStationId ?? null,
                                podcastId: payload.podcastId ?? null,
                            } as FavoriteEntity,
                        ],
                    } );
                }

                // 3️⃣ Llama al backend para confirmar el cambio
                const res = await togglefavorite( payload );


                // ⚡ Invalida React Query para refrescar la lista de favoritos
                queryClient.invalidateQueries( { queryKey: ['favorites', 'infinite', 'radio'] } );
                queryClient.invalidateQueries( { queryKey: ['favorites', 'infinite', 'podcast'] } );

                console.log( "✅ Backend actualizado:", res.message );

                // 4️⃣ (Opcional) Si la API devuelve lista actualizada, refresca
                // if (res.data.) set({ favorites: res.data });

            } catch ( err ) {
                console.error( "⚠️ Error al hacer toggle:", err );
            }
        },




        // removeFavorite: async ( type: EntityType, id: string ) => {
        //     try {
        //         await radioPodcastApi.delete( "/favorites", {
        //             data:
        //                 type === "radio"
        //                     ? { type: "radio", radioStationId: id  }
        //                     : { type: "podcast", podcastId: id },
        //         } );

        //         // Quita del listado local si estás en la page de favoritos
        //         set( {
        //             favorites: get().favorites.filter(
        //                 ( f ) =>
        //                     !(
        //                         ( type === "radio" && f.radioStationId === id ) ||
        //                         ( type === "podcast" && f.podcastId === id )
        //                     )
        //             ),
        //         } );
        //     } catch ( err ) {
        //         console.error( "⚠️ Error al eliminar favorito:", err );
        //     }
        // },

        removeFavorite: async ( type: EntityType, id: string ) => {

            try {
                // 💡 Crea el payload limpio según el tipo
                const isRadio = type === "radio";
                const payload: FavoriteTogglePayload = {
                    type,
                    radioStationId: isRadio ? id : undefined,
                    podcastId: !isRadio ? id : undefined,
                };

                // 🧩 Envia DELETE con cuerpo (body)
                await radioPodcastApi.delete( "/favorites", { data: payload } );

                // 🧠 Actualiza store local para reflejar cambio al instante
                set( {
                    favorites: get().favorites.filter(
                        ( f ) =>
                            !(
                                ( isRadio && f.radioStationId === id ) ||
                                ( !isRadio && f.podcastId === id )
                            )
                    ),
                } );

                // ⚡ Invalida React Query para refrescar la lista de favoritos
                // queryClient.invalidateQueries( { queryKey: ['favorites', 'infinite', 'radio'] } );
                // queryClient.invalidateQueries( { queryKey: ['favorites', 'infinite', 'podcast'] } );

                console.log( "✅ Favorito eliminado correctamente:", payload );
            } catch ( err: any ) {
                console.error( "⚠️ Error al eliminar favorito:", err.response?.data || err.message );
            }
        },

    } ),


);
