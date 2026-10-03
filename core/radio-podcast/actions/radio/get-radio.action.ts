import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import axios from "axios";
import { ParamsRadioStation, type RadioStationResponse } from "../../interface/radio/radio-station-responce.interface";

export const fetchRadioStations = async ( page: number = 1, limit: number = 30, search: string = '', signal?: AbortSignal ) => {

    const params: ParamsRadioStation = { page, limit };
    if ( search && search.trim() !== '' ) params.search = search


    try {
        const { data } = await radioPodcastApi.get<RadioStationResponse>( '/radio-station', { params, signal } )
        return data

    } catch ( error ) {
        // eslint-disable-next-line import/no-named-as-default-member
        if (axios.isCancel(error)) throw error;
        throw new Error( 'No se pudo obtener las emisoras' )
    }
}
