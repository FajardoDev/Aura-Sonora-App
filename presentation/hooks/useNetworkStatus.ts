import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export const useNetworkStatus = () => {
	const [isConnected, setIsConnected] = useState<boolean | null>(null);

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			setIsConnected(state.isConnected && state.isInternetReachable !== false);
		});

		// cleanup al desmontar
		return () => unsubscribe();
	}, []);

	console.log({ isConnected });

	return { isConnected };
};
