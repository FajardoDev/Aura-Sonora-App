// helpers/commentCacheHelpers.ts (Asumiendo que mueves estas funciones a un helper)

import { CommentResponse } from '@/core/radio-podcast/actions/radio-podcast/actions/get-resp-full-api-comment.action';
import { LastComment } from '@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface';
import { InfiniteData, QueryClient } from '@tanstack/react-query';

type CommentsInfiniteData = InfiniteData<CommentResponse>;

// --- 1. AÑADIR (CREATE) ---
export const addCommentToCache = (
    queryClient: QueryClient,
    newComment: LastComment,
    queryKey: any[] // ['comments', type, entityId]
) => {
    queryClient.setQueryData<CommentsInfiniteData>( queryKey, ( oldData ) => {
        if ( !oldData ) return oldData;

        // Inserta el nuevo comentario al inicio de la PRIMERA página
        const newFirstPage = {
            ...oldData.pages[0],
            comments: [newComment, ...oldData.pages[0].comments],
        };

        return {
            ...oldData,
            pages: [newFirstPage, ...oldData.pages.slice( 1 )],
        };
    } );
};

// --- 2. ACTUALIZAR (UPDATE) ---
// export const updateCommentInCache = (
//     queryClient: QueryClient,
//     updatedComment: LastComment,
//     queryKey: any[]
// ) => {
//     queryClient.setQueryData<CommentsInfiniteData>( queryKey, ( oldData ) => {
//         if ( !oldData ) return oldData;

//         const newPages = oldData.pages.map( page => ( {
//             ...page,
//             comments: page.comments.map( comment => {
//                 // Reemplaza el comentario si encontramos el ID que coincide
//                 // comment.id === updatedComment.id ? updatedComment : comment
//                  if (comment.id === updatedComment.id) {
//                     // 💡 CLAVE: Sobrescribe el objeto ANTERIOR con los nuevos valores.
//                     // Esto preserva propiedades como createdAt, user, etc.
//                     return {
//                         ...comment, // Mantiene todas las propiedades antiguas
//                         content: updatedComment.content, // Sobrescribe el contenido
//                         rating: updatedComment.rating,   // Sobrescribe el rating
//                         // Opcional: El servidor DEBE devolver updated: '2025-10-09T...'
//                         updatedAt: new Date().toISOString(), 
//                     };
//                 }
//                 return comment;
//             }),


//         } ) );

//         return { ...oldData, pages: newPages };
//     } );
// };

// helpers/commentCacheHelpers.ts (CORREGIDO)

export const updateCommentInCache = (
    queryClient: QueryClient,
    updatedComment: LastComment, // Este es el objeto que se usa para actualizar
    queryKey: any[]
) => {
    queryClient.setQueryData<CommentsInfiniteData>( queryKey, ( oldData: any ) => {
        if ( !oldData ) return oldData;

        const newPages = oldData.pages.map( ( page: { comments: any[]; } ) => ( {
            ...page,
            comments: page.comments.map( comment => {
                if ( comment.id === updatedComment.id ) {
                    // 💡 CLAVE: Sobrescribe el objeto ANTERIOR con los nuevos valores.
                    // Esto preserva propiedades como createdAt, user, etc.
                    return {
                        ...comment, // Mantiene todas las propiedades antiguas
                        content: updatedComment.content, // Sobrescribe el contenido
                        rating: updatedComment.rating,   // Sobrescribe el rating
                        updatedAt: new Date().toISOString(),

                    };
                }
                return comment;
            } ),
        } ) );

        return { ...oldData, pages: newPages };
    } );
};

// --- 3. ELIMINAR (DELETE) ---
export const deleteCommentFromCache = (
    queryClient: QueryClient,
    deletedId: string,
    queryKey: any[]
) => {
    queryClient.setQueryData<CommentsInfiniteData>( queryKey, ( oldData ) => {
        if ( !oldData ) return oldData;

        const newPages = oldData.pages.map( page => ( {
            ...page,
            // Filtra y elimina el comentario con el ID que se está borrando
            comments: page.comments.filter( comment => comment.id !== deletedId ),
        } ) );

        return { ...oldData, pages: newPages };
    } );
};