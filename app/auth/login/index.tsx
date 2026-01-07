import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import ThemedLink from "@/presentation/theme/components/ThemedLink";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
// Clerk
// import { radioPodcastApi } from "@/core/api/radioPodcastApi";
// import { useSignIn } from "@clerk/clerk-expo";

// Handle any pending authentication sessions
// WebBrowser.maybeCompleteAuthSession();

// const SocialLoginButton = ({
// 	strategy,
// }: {
// 	strategy: "facebook" | "google" | "apple";
// }) => {
// 	const [isLoading, setIsLoading] = useState(false);
// 	const { user } = useUser();
// 	const router = useRouter();

// 	const getStrategy = () => {
// 		if (strategy === "facebook") {
// 			return "oauth_facebook";
// 		} else if (strategy === "google") {
// 			return "oauth_google";
// 		} else if (strategy === "apple") {
// 			return "oauth_apple";
// 		}
// 		return "oauth_facebook";
// 	};

// 	const buttonText = () => {
// 		if (isLoading) {
// 			return "Loading...";
// 		}

// 		if (strategy === "facebook") {
// 			return "Continue with Facebook";
// 		} else if (strategy === "google") {
// 			return "Continue with Google";
// 		} else if (strategy === "apple") {
// 			return "Continue with Apple";
// 		}
// 	};

// 	const buttonIcon = () => {
// 		if (strategy === "facebook") {
// 			return <Ionicons name="logo-facebook" size={24} color="#1977F3" />;
// 		} else if (strategy === "google") {
// 			return <Ionicons name="logo-google" size={24} color="#DB4437" />;
// 		} else if (strategy === "apple") {
// 			return <Ionicons name="logo-apple" size={24} color="black" />;
// 		}
// 	};

// 	// Use the `useSSO()` hook to access the `startSSOFlow()` method
// 	const { startSSOFlow } = useSSO();

// 	const onPress = useCallback(async () => {
// 		// 1. Usa AuthSession.makeRedirectUri para asegurar el formato correcto
// 		const redirectUri = AuthSession.makeRedirectUri({
// 			// El 'scheme' DEBE COINCIDIR con el que tienes en app.json/app.config.js
// 			scheme: "com.radiopodcast",
// 			path: "/oauth-callback", // Usa un path estándar que Clerk recomienda
// 		});

// 		// 2. Verifica la URL generada (IMPORTANTE para debugging)
// 		console.log("Redirect URL generada:", redirectUri);

// 		try {
// 			// Start the authentication process by calling `startSSOFlow()`
// 			setIsLoading(true);
// 			const { createdSessionId, setActive } = await startSSOFlow({
// 				strategy: getStrategy(),
// 				// For web, defaults to current path
// 				// For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
// 				// For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
// 				// redirectUrl: AuthSession.makeRedirectUri({scheme, path}),
// 				// redirectUrl: Linking.createURL("/dashboard", { scheme: redirectUrl }),
// 				// Usa la URI generada por AuthSession
// 				redirectUrl: Linking.createURL("/home", {
// 					scheme: "com.radiopodcast",
// 				}),
// 				// redirectUrl: redirectUri,
// 			});

// 			// If sign in was successful, set the active session
// 			// if (createdSessionId) {
// 			// 	console.log("Session created", createdSessionId);
// 			// 	setActive!({
// 			// 		// await user?.reload(),
// 			// 		session: createdSessionId,
// 			// 		// Check for session tasks and navigate to custom UI to help users resolve them
// 			// 		// See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
// 			// 		navigate: async ({ session }) => {
// 			// 			if (session?.currentTask) {
// 			// 				console.log(session?.currentTask);
// 			// 				router.push("./auth/register/index");
// 			// 				return;
// 			// 			}

// 			// 			router.push("/home");
// 			// 		},
// 			// 	});
// 			// }
// 			// If sign in was successful, set the active session
// 			if (createdSessionId) {
// 				console.log("Session created", createdSessionId);
// 				setActive!({ session: createdSessionId });
// 				await user?.reload();
// 			} else {
// 				// If there is no `createdSessionId`,
// 				// there are missing requirements, such as MFA
// 				// See https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections#handle-missing-requirements
// 			}
// 		} catch (err) {
// 			// See https://clerk.com/docs/guides/development/custom-flows/error-handling
// 			// for more info on error handling
// 			console.error(JSON.stringify(err, null, 2));
// 		}
// 	}, []);

// 	return (
// 		<TouchableOpacity
// 			style={[styles.container]}
// 			onPress={onPress}
// 			disabled={isLoading}
// 		>
// 			{isLoading ? (
// 				<ActivityIndicator size="small" color="black" />
// 			) : (
// 				buttonIcon()
// 			)}
// 			<ThemedText style={styles.buttonText}>{buttonText()}</ThemedText>
// 			<View />
// 		</TouchableOpacity>
// 	);
// };

export default function LoginScreen() {
  // useWarmUpBrowser();

  const { login, chageStatus } = useAuthStore();
  // const { signIn, isLoaded } = useSignIn(); // Clerk login
  const [isPosting, setIsPosting] = useState(false);

  const { height } = useWindowDimensions();
  const router = useRouter(); // const backgroundColor = useThemeColor({}, "background");

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onLogin = async () => {
    const { email, password } = form;

    console.log({ email, password });

    if (email.length === 0 || password.length === 0) {
      // return; // ó mostrar alertas
      return Alert.alert("Error", "Los campos son obligatorios");
    }

    setIsPosting(true);
    const wasSuccessful = await login(email, password);
    setIsPosting(false);

    // if (wasSuccessful) {
    // 	// router.replace("/home");
    // 	const last = await getLastRoute();
    // 	await clearLastRoute();
    // 	router.replace((last as any) ?? "/home"); // navega solo una vez
    // 	return;
    // }

    if (wasSuccessful) {
      router.replace("/home");
      return;
    }

    Alert.alert("Error", "Usuario o contraseña no son correctos");
  };

  // const strategyMap = {
  // 	google: "oauth_google",
  // 	apple: "oauth_apple",
  // 	facebook: "oauth_facebook",
  // } as const;

  // const redirectUrl = "com.radiopodcast://redirect";

  // const handleClerkLogin = async (provider: keyof typeof strategyMap) => {
  // 	if (!isLoaded) return;

  // 	try {
  // 		const strategy = strategyMap[provider]; // ✅ mapea correctamente

  // 		// 1️⃣ Iniciar el flujo OAuth
  // 		const result = await signIn.create({
  // 			strategy,
  // 			redirectUrl,
  // 		});

  // 		const externalRedirectUrl =
  // 			result.firstFactorVerification?.externalVerificationRedirectURL;

  // 		if (!externalRedirectUrl)
  // 			throw new Error("No se obtuvo la URL de verificación externa");

  // 		// 2️⃣ Abrir navegador para login con Google/Facebook/Apple
  // 		const res = await WebBrowser.openAuthSessionAsync(
  // 			externalRedirectUrl as any,
  // 			redirectUrl,
  // 		);

  // 		if (res.type !== "success" || !res.url)
  // 			throw new Error("El flujo OAuth no se completó correctamente");

  // 		// 3️⃣ Clerk agrega `?session_id=` en la URL de retorno
  // 		const url = new URL(res.url);
  // 		const sessionId = url.searchParams.get("session_id");

  // 		if (!sessionId) throw new Error("No se obtuvo sessionId de Clerk");

  // 		// 4️⃣ Intercambiar el sessionId por token en tu backend
  // 		const { data } = await radioPodcastApi.post("/auth/clerk-login", {
  // 			token: sessionId,
  // 		});

  // 		// 5️⃣ Guardar el token en Zustand + SecureStore
  // 		await chageStatus(data.accessToken, data.user);

  // 		router.replace("/home");
  // 	} catch (error) {
  // 		console.log(error);
  // 		Alert.alert("Error", "No se pudo autenticar con Clerk");
  // 	}
  // };

  if (isPosting) {
    return (
      <View className="flex-1 items-center justify-center space-y-2">
        <ActivityIndicator color="#f43f5e" />
        <ThemedText>Por favor espere... </ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      // behavior="height"
      behavior={Platform.OS === "ios" ? "padding" : "height"} // 'padding' for iOS, 'height' o 'position' para Android
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} //Ajusta este valor según sea necesario
    >
      <ScrollView
        // style={{ paddingHorizontal: 40, backgroundColor: "red" }}
        className="px-10 bg-light-background dark:bg-dark-background"
      >
        <View style={{ paddingTop: height * 0.2 }}>
          <ThemedText type="h1">Ingresar</ThemedText>
          <ThemedText type="normal" className="mb-8 mt-4">
            Por favor ingrese para continuar
          </ThemedText>
        </View>

        {/* Proveedores */}
        {/* <View className="flex-row justify-around mb-8">
					<TouchableOpacity onPress={() => handleClerkLogin("google")}>
						<Image
							source={require("./../../../assets/images/logo-google.png")}
							style={{ width: 50, height: 50 }}
							resizeMode="contain"
						/>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => handleClerkLogin("apple")}>
						<Image
							source={require("./../../../assets/images/apple-logo.png")}
							style={{ width: 50, height: 50 }}
							resizeMode="contain"
						/>
					</TouchableOpacity>

					<TouchableOpacity onPress={() => handleClerkLogin("facebook")}>
						<Image
							source={require("./../../../assets/images/logo-facebook.png")}
							style={{ width: 50, height: 50 }}
							resizeMode="contain"
						/>
					</TouchableOpacity>
				</View> */}

        {/* <>
					<SocialLoginButton strategy="google" />
					<SocialLoginButton strategy="apple" />
					<SocialLoginButton strategy="facebook" />
				</> */}

        {/* Email & Password */}

        <View className="mb-10">
          <ThemedText type="normal" className="text-[#4B5563] mb-4 mt-5">
            Correo electrónico
          </ThemedText>
          <ThemeTextInput
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Ingrese su correo electrónico"
            placeholderTextColor="#9CA3AF" // text-gray-400
            icon="mail-outline"
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <ThemedText type="normal" className="text-[#4B5563] mb-4 mt-5">
            Contraseña
          </ThemedText>
          <ThemeTextInput
            secureTextEntry
            autoComplete="off"
            placeholder="Ingrese su contraseña"
            placeholderTextColor="#9CA3AF" // text-gray-400
            icon="lock-closed-outline"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
        </View>

        {/* Button */}
        <ThemedButton
          icon="arrow-forward-circle-outline"
          onPress={onLogin}
          disabled={isPosting}
        >
          Ingresar
        </ThemedButton>

        {/* Enlace a registro */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText>¿No tienes cuenta?</ThemedText>

          <ThemedLink
            href="./register"
            // style={{ marginHorizontal: 5 }}
            className="mx-2 font-Roboto-SemiBold"
          >
            Crear cuenta
          </ThemedLink>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
