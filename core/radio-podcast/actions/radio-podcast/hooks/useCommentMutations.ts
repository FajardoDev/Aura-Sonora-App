// hooks/useCommentMutations.ts (COMPLETO)

import { useMutation, useQueryClient } from '@tanstack/react-query';
// Importa tus helpers y tus funciones de service

import { LastComment } from '@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface';
import { addCommentToCache, deleteCommentFromCache, updateCommentInCache } from '@/helpers/adapters/comments/commentCacheHelpers';
import { createComment, deleteComment, updateComment } from '../actions/get-resp-full-api-comment.action';

// Tipos para las entradas de las mutaciones
type CreatePayload = { content: string, rating: number };
type UpdatePayload = { id: string, content: string, rating: number };
type DeletePayload = { id: string };

export const useCommentMutations = ( type: "radio" | "podcast", entityId: string ) => {
    const queryClient = useQueryClient();
    const queryKey = ['comments', type, entityId]; // Clave de caché única para esta lista

    // 📝 1. MUTACIÓN CREAR
    const createCommentMutation = useMutation<LastComment, Error, CreatePayload>( {
        mutationFn: ( commentData ) =>
            createComment( {
                ...commentData,
                radioStationId: type === "radio" ? entityId : null,
                podcastId: type === "podcast" ? entityId : null,
            }, type, entityId ),

        onSuccess: ( newComment ) => {
            // Llama al helper para añadir el comentario al caché
            addCommentToCache( queryClient, newComment, queryKey );
        },
    } );

    // ✏️ 2. MUTACIÓN ACTUALIZAR
    const updateCommentMutation = useMutation<LastComment, Error, UpdatePayload>( {
        mutationFn: ( { id, content, rating } ) =>
            updateComment( id, { content, rating } ),

        onMutate: async ( updatedPayload ) => {
            // Se asume que el backend devuelve la estructura completa (LastComment)
            const mockUpdatedComment: LastComment = {
                // Esto es solo un ejemplo. Lo ideal es actualizar con el objeto completo
                id: updatedPayload.id,
                content: updatedPayload.content,
                rating: updatedPayload.rating,
                // Mantener el resto de la data del usuario, etc.
            } as LastComment;

            // OPTIMISTIC UPDATE: Actualiza el caché ANTES de que el backend responda
            updateCommentInCache( queryClient, mockUpdatedComment, queryKey );
        },
        // Si el backend responde (onSuccess), no necesitas hacer nada más si hiciste optimistic update.
    } );

    // 🗑️ 3. MUTACIÓN ELIMINAR
    const deleteCommentMutation = useMutation<boolean, Error, DeletePayload>( {
        mutationFn: ( { id } ) =>
            deleteComment( id ),

        onMutate: async ( deletedPayload ) => {
            // OPTIMISTIC UPDATE: Elimina del caché ANTES de que el backend responda
            deleteCommentFromCache( queryClient, deletedPayload.id, queryKey );
        },
        // Si el backend responde (onSuccess), no necesitas hacer nada más.
        // Si falla, podrías revertir el cambio o invalidar.
    } );

    return {
        createCommentMutation,
        updateCommentMutation,
        deleteCommentMutation,
        // Funciones de conveniencia que podrías necesitar en Comentarios.tsx
        isCreating: createCommentMutation.isPending,
        isDeleting: deleteCommentMutation.isPending,
    };
};