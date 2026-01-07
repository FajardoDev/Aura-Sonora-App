import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { FavoriteListRespons, FavoriteQueryParameters, FavoriteTogglePayload, FavoriteToggleResponse } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";


export const togglefavorite = async ( payload: FavoriteTogglePayload ): Promise<FavoriteToggleResponse> => {

    const response = await radioPodcastApi.post( '/favorites', payload )
    return response.data
}

export const getFavorites = async (
    params: FavoriteQueryParameters,
): Promise<FavoriteListRespons> => {

    const response = await radioPodcastApi.get( '/favorites', { params } );

    return response.data;
};


// core/api/favorites.api.ts
export const getFavoriteStatus = async ( payload: FavoriteTogglePayload ): Promise<{ isFavorite: boolean }> => {
    const { data } = await radioPodcastApi.post( "/favorites/status", payload );
    return data;
};


// ... (Aquí irían otras funciones como getStations, getPodcasts, etc.)