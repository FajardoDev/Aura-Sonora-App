import { CommentResponse, fetchCommentsByEntity } from "@/core/radio-podcast/actions/radio-podcast/actions/get-resp-full-api-comment.action";
import { useInfiniteQuery } from "@tanstack/react-query";


const ITEMS_PER_PAGE = 10;

export const useComments = ( type: "radio" | "podcast", entityId: string ) => {

    const commentsQuery = useInfiniteQuery<CommentResponse, Error>( {

        queryKey: ['comments', type, entityId],
        queryFn: ( { pageParam = 1 } ) =>
            fetchCommentsByEntity( type, entityId, pageParam as number, ITEMS_PER_PAGE ),

        initialPageParam: 1,

        // 💡 Lógica de paginación infinita
        getNextPageParam: ( lastPage ) => {
            // lastPage es el objeto CommentResponse
            if ( lastPage.meta.page < lastPage.meta.totalPages ) {
                // Si la página actual es menor que el total, pedimos la siguiente
                return lastPage.meta.page + 1;
            }
            // Si no hay más páginas
            return undefined;
        },

        staleTime: 1000 * 60 * 60, //1hora   
    } )

    // Extraemos todos los comentarios en un array plano para el FlatList
    const allComments = commentsQuery.data?.pages.flatMap( page => page.comments ) ?? [];

    return {
        commentsQuery,
        allComments, // Array plano de comentarios
        loadNextPage: commentsQuery.fetchNextPage,
        hasNextPage: commentsQuery.hasNextPage,
    }


}
