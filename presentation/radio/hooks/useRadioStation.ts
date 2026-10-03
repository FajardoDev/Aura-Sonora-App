import { fetchRadioStations } from "@/core/radio-podcast/actions/radio/get-radio.action";
import { useInfiniteQuery } from "@tanstack/react-query";

// const queryParams = {
//   page: 1,
//   limit: 30,
//   search: '',
// };
const ITEMS_PER_PAGE = 21;

export const useRadioStation = (searchQuery: string = "", enabled = true) => {
	const radioStationQuery = useInfiniteQuery({
		queryKey: ["radioStations", "infinite", searchQuery], // searchQuery 👈 sin el término aquí
		enabled,
		queryFn: ({ pageParam = 1, signal }) =>
			fetchRadioStations(pageParam as number, ITEMS_PER_PAGE, searchQuery, signal),
		// enabled: searchQuery.trim() !== "", // 🚀 Solo busca si hay texto
		// refetchOnWindowFocus: false, // ❌ No revalida al volver a la app
		// refetchOnReconnect: false, // ❌ No revalida si se reconecta a la red
		// staleTime: 1000 * 60 * 60 * 24,  24h || 5 * 60 * 1000 5 minutos
		staleTime: 1000 * 60 * 60, //1hora

		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			if (lastPage.currentPage < lastPage.totalPages) {
				return lastPage.currentPage + 1;
			}

			// Si no hay más páginas, devolvemos `undefined` o `null`.
			return undefined;
		},
		placeholderData: (prev) => prev, // 👈 reemplaza a keepPreviousData

		// placeholderData: keepPreviousData, // ✅ reemplazo moderno // 👈 mantiene la data anterior mientras busca
		// refetchOnWindowFocus: false,
	});

	return {
		radioStationQuery,

		// methods
		loadNextPage: radioStationQuery.fetchNextPage,
		isSearching:
			radioStationQuery.isFetching && radioStationQuery.dataUpdatedAt === 0,
		hasNextPage: radioStationQuery.hasNextPage,
	};
};
