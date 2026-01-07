import { getPopularCategoriesPodcast } from "@/core/radio-podcast/actions/podcast/get-podcast-popular-categories";
import { useQuery } from "@tanstack/react-query";

export const usePopularCategoriesPodcast = () => {
	const popularCategoriesPodcastQuery = useQuery({
		queryKey: ["popularCategoriesPodcast"],
		queryFn: () => getPopularCategoriesPodcast(),
		staleTime: 1000 * 60 * 60, // 1hora
	});

	return {
		popularCategoriesPodcastQuery,
	};
};
