import { useMemo } from "react";
import { usePodcast } from "../podcast/hooks/usePodcasts";
import { useRadioStation } from "../radio/hooks/useRadioStation";

export const useGlobalSearch = (query: string) => {
	const { podcastQuery } = usePodcast(query);
	const { radioStationQuery } = useRadioStation(query);

	const isLoading = podcastQuery.isLoading || radioStationQuery.isLoading;
	const isSearching = podcastQuery.isFetching || radioStationQuery.isFetching;

	const podcasts = useMemo(
		() => podcastQuery.data?.pages?.flatMap((p) => p.podcast ?? []) ?? [],
		[podcastQuery.data],
	);

	const radios = useMemo(
		() => radioStationQuery.data?.pages?.flatMap((r) => r.stations ?? []) ?? [],
		[radioStationQuery.data],
	);

	return {
		isLoading,
		isSearching,
		podcasts,
		radios,
		refetchAll: () => {
			podcastQuery.refetch();
			radioStationQuery.refetch();
		},
	};
};
