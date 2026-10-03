import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import axios from "axios";
import { ParamsRadioStation, type PodcastResponse, } from "../../interface/radio/radio-station-responce.interface";

export const fetchPodcasts = async ( page: number = 1, limit: number = 30, search: string = '', signal?: AbortSignal ) => {

    const params: ParamsRadioStation = { page, limit };
    if ( search && search.trim() !== '' ) params.search = search

    try {
        const { data } = await radioPodcastApi.get<PodcastResponse>( '/podcastrd', { params, signal } )
        return data

    } catch ( error ) {
        // Mantener la cancelación como tal, sin convertirla en un error de búsqueda.
        // eslint-disable-next-line import/no-named-as-default-member
        if (axios.isCancel(error)) throw error;
        throw new Error( 'No se pudieron obtener los podcasts' )
    }

}
