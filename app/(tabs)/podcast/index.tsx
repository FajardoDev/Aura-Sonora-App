/* eslint-disable react-hooks/exhaustive-deps */
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import GridPodcast from "@/presentation/podcast/components/GridPodcast";
import { usePodcast } from "@/presentation/podcast/hooks/usePodcasts";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
  View,
} from "react-native";

export default function PodcastScreem() {
  const [inputValue, setInputValue] = useState("");
  // const [isOffline, setIsOffline] = useState(false);
  const { isConnected } = useNetworkStatus();

  const [debouncedSearch, setDebouncedSearch] = useState(inputValue);

  const router = useRouter();

  const { slug, search } = useLocalSearchParams<{ slug?: string; search?: string }>();

  useEffect(() => {
    if (typeof search === "string") {
      setInputValue(search);
      setDebouncedSearch(search);
    }
  }, [search]);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // useEffect(() => {
  // 	const checkConnection = async () => {
  // 		const state = await Network.getNetworkStateAsync();
  // 		setIsOffline(!state.isConnected);
  // 	};
  // 	checkConnection();
  // }, []);

  useEffect(() => {
    if (slug) {
      router.replace(`/podcast/${slug}`);
    }
  }, [slug]);

  // const debouncedSearchTerm = useDebounce(inputValue, 300);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(inputValue), 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const { podcastQuery, loadNextPage, hasNextPage } =
    usePodcast(debouncedSearch);

  useFocusEffect(
    useCallback(() => {
      podcastQuery.refetch();
      return () => {};
    }, [podcastQuery.refetch]) // Dependencia simplificada
  );

  if (isConnected === null || podcastQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color={"#f43f5e"} />
        <ThemedText>Cargando podcast... 🎙</ThemedText>
      </View>
    );
  }

  // 2️⃣ Sin conexión (modo offline)
  if (!isConnected) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold">
          Sin conexión a Internet
        </ThemedText>
        <ThemedText className="text-gray-500 text-center my-2">
          Puedes escuchar tus episodios descargados o reconectarte para ver más
          contenido.
        </ThemedText>

        <Button
          title="Reintentar"
          onPress={async () => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              Alert.alert(
                "Sin conexión",
                "Aún no tienes Internet. Revisa tu red y vuelve a intentarlo."
              );
              return;
            }
            podcastQuery.refetch(); // solo si realmente hay conexión
          }}
        />
      </View>
    );
  }

  // 3️⃣ Error genérico (solo si hay conexión)
  if (podcastQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background p-4">
        <ThemedText className="text-lg font-semibold">
          No se pudieron cargar los podcast 🎙
        </ThemedText>
        <ThemedText className="text-gray-500 text-center mt-2">
          Ocurrió un error inesperado, intenta de nuevo.
        </ThemedText>
      </View>
    );
  }

  // if (podcastQuery.isError) {
  // 	const isNetworkError = podcastQuery.error?.message?.includes(
  // 		"Network request failed",
  // 	);

  // 	return (
  // 		<View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background p-4">
  // 			<ThemedText className="text-lg font-semibold">
  // 				{isNetworkError
  // 					? "Sin conexión a Internet"
  // 					: "No se pudieron cargar los podcast"}
  // 			</ThemedText>
  // 			<ThemedText className="text-gray-500 text-center mt-2">
  // 				{isNetworkError
  // 					? "Revisa tu conexión o abre tus episodios descargados."
  // 					: "Ocurrió un error inesperado, intenta de nuevo."}
  // 			</ThemedText>
  // 		</View>
  // 	);
  // }

  // if (podcastQuery.isError) {
  // 	return (
  // 		<View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
  // 			<ThemedText className="text-center">
  // 				No se pudieron cargar los podcast🎼🎶
  // 			</ThemedText>
  // 		</View>
  // 	);
  // }

  // const allPodcast: Podcasts[] =
  // 	podcastQuery.data?.pages?.flatMap((page) => page.podcast ?? []) ?? [];

  // 🔥 FILTRO SOLO AUDIOBOOKS
  const allPodcast =
    podcastQuery.data?.pages
      ?.flatMap((page) => page.podcast ?? [])
      ?.filter((item) => item.isAudiobook === false) ?? [];

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background mt-0 ">
      <PlayerBackground style={{ position: "absolute", inset: 0 }} />

      <View className="relative mx-3">
        {/* Busqueda */}
        <ThemeTextInput
          placeholder="Buscar podcast..."
          icon="mic-outline"
          value={inputValue}
          onChangeText={setInputValue} // Permanece reactivo
          style={{
            height: 48,
            paddingLeft: 42, // espacio para icono search
            paddingRight: 42, // espacio para el ❌
            borderRadius: 14,
            backgroundColor: isDark ? "#1E293B" : "rgba(255,255,255,0.95)",
            borderWidth: isDark ? 0 : 1,
            borderColor: "#E2E8F0",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          }}
        />

        {inputValue.length > 0 && (
          <TouchableOpacity
            onPress={() => setInputValue("")}
            style={{
              position: "absolute",
              right: 14,
              top: "40%",
              zIndex: 100,
              transform: [{ translateY: -10 }],
            }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? "#94A3B8" : "#9CA3AF"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Manejo de "No hay resultados" */}
      {!podcastQuery.isFetching && allPodcast?.length === 0 && (
        <View style={{ margin: 20, alignItems: "center" }}>
          <ThemedText className="text-center">
            No hay resultados para: {inputValue} 😔
          </ThemedText>
        </View>
      )}

      <GridPodcast
        podcasts={allPodcast}
        loadNextPage={loadNextPage}
        hasNextPage={hasNextPage}
        isSearching={podcastQuery.isFetchingNextPage}
      />
    </View>
  );
}
