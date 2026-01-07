import { getTopStation } from "@/core/radio-podcast/actions/radio/get-top-station";
import { useQuery } from "@tanstack/react-query";

export const useTopStation = () => {
	const topStationQuery = useQuery({
		queryKey: ["topStation"],
		queryFn: () => getTopStation(),
		staleTime: 1000 * 60 * 60, // 1hora
	});

	return {
		topStationQuery,
	};
};
