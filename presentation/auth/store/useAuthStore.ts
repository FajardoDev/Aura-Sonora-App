import {
    authCheckStatus,
    authLogin,
    register,
} from "@/core/auth/actions/auth-actions";
import { User } from "@/core/auth/interface/user";
import { queryClient } from "@/core/query-client/queryClient";
import { SecureStorageAdapter } from "@/helpers/adapters/secure-storage.adapter";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export type AuthStatus = "authenticated" | "unauthenticated" | "cheking";

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
		await SecureStore.setItemAsync("lastRoute", route);
		set({ lastRoute: route });
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
		set({ status: "authenticated", accessToken: accessToken, user: user });

		//! Guardar el token en el secure storage
		await SecureStorageAdapter.setItem("accessToken", accessToken);

		return true;
	},

	login: async (email: string, password: string) => {
		const resp = await authLogin(email, password);

		// ✅ Limpia cache cuando entra otro usuario
		queryClient.clear();
		return get().chageStatus(resp?.accessToken, resp?.user);
	},

	register: async (fullName: string, email: string, password: string) => {
		const resp = await register(fullName, email, password);

		return get().chageStatus(resp?.accessToken, resp?.user);
	},

	checkStatus: async () => {
		// if (get().user) { return; } // Probar user entre al colocar las credenciales correctas

		const resp = await authCheckStatus();
		get().chageStatus(resp?.accessToken, resp?.user);
	},

	logout: async () => {
		// detener audio antes de limpiar auth
		await useAudioPlayerStore.getState().clearStream();

		//! Clear token del secure storage
		SecureStorageAdapter.removeItem("accessToken");

		set({ status: "unauthenticated", accessToken: undefined, user: undefined });
		// Alert.alert( "Cierre de sesión sastifastorio" )
		// ✅ Limpia cache cuando entra otro usuario
		queryClient.clear();
	},
}));
