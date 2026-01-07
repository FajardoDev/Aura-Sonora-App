import { getTopPodcast } from "@/core/radio-podcast/actions/podcast/get-top-podcast";
import { useQuery } from "@tanstack/react-query";

export const useTopPodcast = () => {
	const topPodcastQuery = useQuery({
		queryKey: ["topPodcast"],
		queryFn: () => getTopPodcast(),
		staleTime: 1000 * 60 * 60, // 1hora
	});

	return {
		topPodcastQuery,
	};
};
