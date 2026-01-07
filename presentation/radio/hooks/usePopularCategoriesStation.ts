import { getPopularCategoriesStation } from "@/core/radio-podcast/actions/radio/get-station-popular-categories";
import { useQuery } from "@tanstack/react-query";

export const usePopularCategoriesStation = () => {
	const popularCategoriesStationQuery = useQuery({
		queryKey: ["popularCategoriesStation"],
		queryFn: () => getPopularCategoriesStation(),
		staleTime: 1000 * 60 * 60, // 1hora
	});

	return {
		popularCategoriesStationQuery,
	};
};
