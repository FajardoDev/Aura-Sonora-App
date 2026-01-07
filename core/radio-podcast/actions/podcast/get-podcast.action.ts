import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { ParamsRadioStation, type PodcastResponse, } from "../../interface/radio/radio-station-responce.interface";

export const fetchPodcasts = async ( page: number = 1, limit: number = 30, search: string = '' ) => {

    const params: ParamsRadioStation = { page, limit };
    if ( search && search.trim() !== '' ) params.search = search

    try {
        const { data } = await radioPodcastApi.get<PodcastResponse>( '/podcastrd', { params } )
        return data

    } catch ( error ) {
        console.log( error );
        throw new Error( 'No se pudo obtener las emisoras' )
    }

}