import { fetchPodcasts } from "@/core/radio-podcast/actions/podcast/get-podcast.action";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

// const queryParams = {
//   page: 1,
//   limit: 30,
//   search: '',
// };
const ITEMS_PER_PAGE = 21;

export const usePodcast = (searchQuery: string = "") => {
	const podcastQuery = useInfiniteQuery({
		queryKey: ["podcastrd", "infinite", searchQuery],
		queryFn: ({ pageParam = 1 }) =>
			fetchPodcasts(pageParam as number, ITEMS_PER_PAGE, searchQuery),
		// enabled: searchQuery.trim() !== "", // 🚀 Solo busca si hay texto
		// refetchOnWindowFocus: false, // ❌ No revalida al volver a la app
		// refetchOnReconnect: false, // ❌ No revalida si se reconecta a la red
		// staleTime: 1000 * 60 * 60 * 24,  24h || 5 * 60 * 1000 5 minutos
		staleTime: 1000 * 60 * 60, //1hora

		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if ((lastPage.meta.currentPage as any) < lastPage.meta.totalPages) {
				return lastPage.meta.currentPage + 1;
			}

			// Si no hay más páginas, devolvemos `undefined` o `null`.
			return undefined;
		},

		// placeholderData: ( prev ) => prev, // 👈 reemplaza a keepPreviousData
		// refetchOnWindowFocus: false,
		placeholderData: keepPreviousData,
	});

	return {
		podcastQuery,

		// methods
		loadNextPage: podcastQuery.fetchNextPage,
		isSearching: podcastQuery.isFetching && podcastQuery.dataUpdatedAt === 0,
		hasNextPage: podcastQuery.hasNextPage,
	};
};
