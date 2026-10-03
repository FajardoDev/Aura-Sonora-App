import {
    authCheckStatus,
    authLogin,
    register,
} from "@/core/auth/actions/auth-actions";
import { User } from "@/core/auth/interface/user";
import { queryClient } from "@/core/query-client/queryClient";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import { useNotificationStore } from "@/presentation/radio-podcast/stores/notifications.store";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export type AuthStatus = "authenticated" | "unauthenticated" | "cheking";

let statusCheck: Promise<void> | undefined;
let sessionVersion = 0;

interface AuthState {
	status: AuthStatus;
	accessToken?: string;
	user?: User;

	//  Methods
	login: (email: string, password: string) => Promise<boolean>;
	register: (
		fullName: string,
		email: string,
		password: string,
	) => Promise<boolean>;
	checkStatus: () => Promise<void>;
	logout: () => Promise<void>;

	chageStatus: (accessToken?: string, user?: User) => Promise<boolean>;

	// Guardar ruta
	lastRoute: string | null;
	setLastRoute: (route: string) => Promise<void>;
	getLastRoute: () => Promise<string | null>;
	clearLastRoute: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
	// Properties
	status: "cheking",
	accessToken: undefined,
	user: undefined,
	lastRoute: null,

	// Method ó Actions

	setLastRoute: async (route) => {
		set({ lastRoute: route });
		await SecureStorageAdapter.setItem("lastRoute", route);
	},

	getLastRoute: async () => {
		const route = await SecureStore.getItemAsync("lastRoute");
		set({ lastRoute: route });
		return route;
	},

	clearLastRoute: async () => {
		await SecureStore.deleteItemAsync("lastRoute");
		set({ lastRoute: null });
	},

	chageStatus: async (accessToken?: string, user?: User) => {
		sessionVersion++;
		await queryClient.cancelQueries();
		queryClient.clear();
		useNotificationStore.getState().reset();
		if (!accessToken || !user) {
			set({
				status: "unauthenticated",
				accessToken: undefined,
				user: undefined,
			});
			//! Llamar logout
			await SecureStorageAdapter.removeItem("accessToken");
			return false;
		}

		// Si está autenticado
		//! Guardar el token en el secure storage
		await SecureStorageAdapter.setItem("accessToken", accessToken);
		set({ status: "authenticated", accessToken, user });

		return true;
	},

	login: async (email: string, password: string) => {
		const resp = await authLogin(email, password);

		return get().chageStatus(resp?.accessToken, resp?.user);
	},

	register: async (fullName: string, email: string, password: string) => {
		const resp = await register(fullName, email, password);

		return get().chageStatus(resp?.accessToken, resp?.user);
	},

	checkStatus: async () => {
		if (statusCheck) return statusCheck;
		if (get().status !== "cheking") return;
		const version = sessionVersion;
		statusCheck = (async () => {
			const token = await SecureStorageAdapter.getItem("accessToken");
			if (version !== sessionVersion) return;
			if (!token) {
				await get().chageStatus();
				return;
			}
			try {
				const resp = await authCheckStatus();
				if (version === sessionVersion) await get().chageStatus(resp.accessToken, resp.user);
			} catch (error) {
				if (version !== sessionVersion) return;
				if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
					await get().chageStatus();
				} else {
					// Let visitors browse without erasing a session on a network failure.
					useNotificationStore.getState().reset();
					set({ status: "unauthenticated", user: undefined, accessToken: undefined });
				}
			}
		})().finally(() => { statusCheck = undefined; });
		return statusCheck;
	},

	logout: async () => {
		sessionVersion++;
		set({ status: "unauthenticated", accessToken: undefined, user: undefined });
		// detener audio antes de limpiar auth
		await useAudioPlayerStore.getState().clearStream();

		//! Clear token del secure storage
		await SecureStorageAdapter.removeItem("accessToken");
		await get().clearLastRoute();
		useNotificationStore.getState().reset();

		set({ status: "unauthenticated", accessToken: undefined, user: undefined });
		// Alert.alert( "Cierre de sesión sastifastorio" )
		// ✅ Limpia cache cuando entra otro usuario
		await queryClient.cancelQueries();
		queryClient.clear();
	},
}));
