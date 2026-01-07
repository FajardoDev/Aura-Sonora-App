
import { fetchPodcastById } from "@/core/radio-podcast/actions/podcast/fetch-podcastBy-id"
import { Podcast } from "@/core/radio-podcast/interface/podcast/podcast-responce-by-id.interface"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Alert } from "react-native"

export const usePodcastById = ( slug: string ) => {

    const podcastByIdQuery = useQuery( {
        queryKey: ['podcast', slug],
        queryFn: () => fetchPodcastById( slug ),
        staleTime: 1000 * 60 * 60, // 1hora
        // enabled: !!slug,
        // enabled: !!slug, // Solo se ejecuta si el slug existe
    } )

    // Mutación
    const podcastByMutation = useMutation( {
        mutationFn: async ( data: Podcast ) => {
            // TODO: disprar la accion de guardar
            console.log( { data } );

            return data
        },
        onSuccess( data: Podcast ) {

            //TODO Invalidar podcasts queries

            Alert.alert( 'Podcast guardado', `${data.titleEncabezado} se guardo correctamente` )
        },
    } )


    // Mantener el slug del producto

    return {
        podcastByIdQuery,
        podcastByMutation
    }
}