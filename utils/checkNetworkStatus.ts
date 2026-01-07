import * as Network from "expo-network";

export const checkNetworkStatus = async (): Promise<boolean> => {
	try {
		const networkState = await Network.getNetworkStateAsync();
		return networkState.isConnected ?? false;
	} catch {
		return false;
	}
};