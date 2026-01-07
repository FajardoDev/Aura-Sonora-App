// screens/AudiobookScreen.tsx
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import GridPodcast from "@/presentation/podcast/components/GridPodcast";
import { usePodcast } from "@/presentation/podcast/hooks/usePodcasts";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useFocusEffect } from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
  View,
} from "react-native";

export default function AudiobookScreen() {
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(inputValue);
  const { isConnected } = useNetworkStatus();
  const { podcastQuery, loadNextPage, hasNextPage } =
    usePodcast(debouncedSearch);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(inputValue), 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  useFocusEffect(
    useCallback(() => {
      podcastQuery.refetch();
      return () => {};
    }, [podcastQuery.refetch])
  );

  // 🔥 FILTRO SOLO AUDIOBOOKS
  const allAudiobooks =
    podcastQuery.data?.pages
      ?.flatMap((page) => page.podcast ?? [])
      ?.filter((item) => item.isAudiobook === true) ?? [];

  if (isConnected === null || podcastQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color={"#f43f5e"} />
        <ThemedText>Cargando audiolibros... 🎧</ThemedText>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold">
          Sin conexión a Internet
        </ThemedText>
        <ThemedText className="text-gray-500 text-center my-2">
          Verifica tu conexión e inténtalo nuevamente.
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
            podcastQuery.refetch();
          }}
        />
      </View>
    );
  }

  if (podcastQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background p-4">
        <ThemedText className="text-lg font-semibold">
          Error al cargar los audiolibros 🎧
        </ThemedText>
        <ThemedText className="text-gray-500 text-center mt-2">
          Intenta nuevamente más tarde.
        </ThemedText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background">
      <PlayerBackground style={{ position: "absolute", inset: 0 }} />
      <View className="relative mx-3">
        {/* Busqueda */}
        <ThemeTextInput
          placeholder="Buscar audiolibros..."
          icon="book-outline"
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

      {!podcastQuery.isFetching && allAudiobooks?.length === 0 && (
        <View style={{ margin: 20, alignItems: "center" }}>
          <ThemedText className="text-center">
            No se encontraron audiolibros 😔
          </ThemedText>
        </View>
      )}

      <GridPodcast
        podcasts={allAudiobooks}
        loadNextPage={loadNextPage}
        hasNextPage={hasNextPage}
        isSearching={podcastQuery.isFetchingNextPage}
      />
    </View>
  );
}
