import { fetchRadioStationsBySlug } from "@/core/radio-podcast/actions/radio/get-radio-by-slug.action"
import { useQuery } from "@tanstack/react-query"

export const useRadioStationBySlug = ( slug: string ) => {

    const radioStationBySlugQuery = useQuery( {
        queryKey: ['radioStation', slug],
        queryFn: () => fetchRadioStationsBySlug( slug ),
        staleTime: 1000 * 60 * 60, // 1hora
        // enabled: !!slug, // Solo se ejecuta si el slug existe
    } )

    // Mutación
    // Mantener el slug del producto

    return {
        radioStationBySlugQuery
    }
}
