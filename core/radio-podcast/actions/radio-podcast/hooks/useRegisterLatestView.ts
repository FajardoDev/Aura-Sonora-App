import { useMutation } from "@tanstack/react-query";
import { LatestViewPayload, registerLatestView } from "../actions/register-latest-view.action";






/**
 * Hook para registrar la última estación de radio o podcast reproducido.
 * Utiliza useMutation ya que es una operación de escritura (POST).
 */
export const useRegisterLatestView = () => {
    // No necesitamos invalidar ninguna query Key específica aquí
    // ya que este registro es principalmente para el backend y no afecta el caché de datos visibles.
    // Si tuvieras una query para 'mi historial de reproducciones', la invalidarías aquí.

    return useMutation( {
        mutationFn: ( payload: LatestViewPayload ) => registerLatestView( payload ),

        // Opcional: Puedes agregar logging o efectos secundarios después de un éxito
        onSuccess: ( data, variables ) => {
            console.log( `[useMutation] Última vista registrada con éxito para tipo: ${variables.type}` );
            // Aquí iría queryClient.invalidateQueries({ queryKey: ['userHistory'] }) si tuvieras ese hook
        },

        onError: ( error, variables ) => {
            console.error( `[useMutation] Fallo al registrar la última vista para ${variables.type}.`, error );
        },
    } );
};
