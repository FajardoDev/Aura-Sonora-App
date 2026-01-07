import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { checkNetworkStatus } from "@/utils/checkNetworkStatus";
import axios from "axios";
import { Alert, Platform } from "react-native";

// TODO: conectar mediante envs vars, Android e IOS

export const API_URL = process.env.EXPO_PUBLIC_API_URL!;

const STAGE = process.env.EXPO_PUBLIC_STAGE || "dev";

// export const API_URL =
// 	STAGE === "prod"
// 		? process.env.EXPO_PUBLIC_API_URL
// 		: Platform.OS === "ios"
// 			? process.env.EXPO_PUBLIC_API_URL_IOS
// 			: process.env.EXPO_PUBLIC_API_URL_ANDROID;

console.log({ STAGE, [Platform.OS]: API_URL });

const radioPodcastApi = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// TODO: Interceptores
radioPodcastApi.interceptors.request.use(async (config) => {
  const isOnline = await checkNetworkStatus();

  // Verficar si hay token en el secureStore
  const accessToken = await SecureStorageAdapter.getItem("accessToken");

  if (!isOnline) {
    // eslint-disable-next-line import/no-named-as-default-member
    throw new axios.Cancel("Sin conexión a Internet");
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // console.log("🚀 Request to:", config.baseURL);

  return config;
});

radioPodcastApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // eslint-disable-next-line import/no-named-as-default-member
    if (axios.isCancel(error)) {
      console.log("🌐 Petición cancelada: offline");
    } else if (error.code === "ECONNABORTED") {
      Alert.alert(
        "Error",
        "Tiempo de espera agotado al conectar con el servidor."
      );
    } else {
      console.warn("⚠️ Error de red:", error.message);
    }
    return Promise.reject(error);
  }
);

export { radioPodcastApi };
