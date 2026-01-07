import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { ParamsRadioStation, type RadioStationResponse } from "../../interface/radio/radio-station-responce.interface";

export const fetchRadioStations = async ( page: number = 1, limit: number = 30, search: string = '' ) => {

    const params: ParamsRadioStation = { page, limit };
    if ( search && search.trim() !== '' ) params.search = search


    try {
        const { data } = await radioPodcastApi.get<RadioStationResponse>( '/radio-station', { params } )
        return data

    } catch ( error ) {
        throw new Error( 'No se pudo obtener las emisoras' )
    }
}