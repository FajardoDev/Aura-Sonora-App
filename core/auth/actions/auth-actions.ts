import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { User } from "../interface/user";

export interface AuthResponse {
	id: string;
	email: string;
	fullName: string;
	isActive: boolean;
	roles: string[];
	image?: string | null;
	accessToken: string;
	// refreshToken: string;
}

const returnUserToken = (
	data: AuthResponse,
): {
	user: User;
	accessToken: string;
} => {
	const { accessToken, ...user } = data; // const user: User = {id,email,fullName,isActive,roles};
	return { user, accessToken };
};

export const authLogin = async (email: string, password: string) => {
	email = email.toLowerCase();

	try {
		const { data } = await radioPodcastApi.post<AuthResponse>("/auth/login", {
			email,
			password,
		});

		return returnUserToken(data);
	} catch (error) {
		console.log(error);
		// throw new Error('User and/or password not valid');
		return null;
	}
};

export const authCheckStatus = async () => {
	try {
		const { data } = await radioPodcastApi.get<AuthResponse>(
			"/auth/check-status",
		);

		return returnUserToken(data);
	} catch (error) {
		console.log(error);
		return null;
	}
};

// TODO: Tarea: Hacer el register
export const register = async (
	fullName: string,
	email: string,
	password: string,
) => {
	email = email.toLowerCase();

	try {
		const { data } = await radioPodcastApi.post("/auth/register", {
			fullName,
			email,
			password,
		});

		return returnUserToken(data);
	} catch (error) {
		console.log(error, "No se pudo crear el usuario");
		return null;
	}
};


