import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LatestViewPayload, registerLatestView } from "../actions/register-latest-view.action";






/**
 * Hook para registrar la última estación de radio o podcast reproducido.
 * Utiliza useMutation ya que es una operación de escritura (POST).
 */
export const useRegisterLatestView = () => {
    const queryClient = useQueryClient();

    return useMutation( {
        mutationFn: ( payload: LatestViewPayload ) => registerLatestView( payload ),

        // Opcional: Puedes agregar logging o efectos secundarios después de un éxito
        onSuccess: ( data, variables ) => {
            console.log( `[useMutation] Última vista registrada con éxito para tipo: ${variables.type}` );
            if (variables.type === "radio") {
                return queryClient.invalidateQueries({ queryKey: ["history", "home"], exact: true });
            }
        },

        onError: ( error, variables ) => {
            console.error( `[useMutation] Fallo al registrar la última vista para ${variables.type}.`, error );
        },
    } );
};
