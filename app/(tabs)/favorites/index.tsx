import { useFetchFavorites } from "@/core/radio-podcast/hooks/useFetchFavorites";
import { EntityType } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import FavoriteGridItem from "@/presentation/radio/components/FavoriteGridItem";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export default function TabsFavoritesScreen() {
  // 1. Estado para el filtro (Radio o Podcast)
  const [selectedType, setSelectedType] = useState<EntityType>("radio");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient(); // Necesario para la invalidación
  const { isConnected } = useNetworkStatus();

  const background = useThemeColor({}, "background");

  // const { favorites, removeFavorite } = useFavoritesStore();

  // 2. Hook de datos con Infinite Scroll
  const { favoriteQuery, allFavorites, loadNextPage, hasNextPage } =
    useFetchFavorites(selectedType as any);

  // Clave de consulta específica para el tipo seleccionado
  const currentQueryKey = ["favorites", "infinite", selectedType];

  if (
    isConnected === null ||
    (favoriteQuery.isLoading && favoriteQuery.isFetchingNextPage === false)
  ) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background ">
        <ActivityIndicator size="large" color="#f43f5e" />
        <ThemedText style={{ marginTop: 10 }}>
          Cargando favoritos... ❤️
        </ThemedText>
      </ThemedView>
    );
  }

  // 2️⃣ Sin conexión (modo offline)
  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background p-4">
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
            favoriteQuery.refetch(); // solo si realmente hay conexión
          }}
        />
      </View>
    );
  }

  if (favoriteQuery.isError) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ThemedText className="text-lg font-semibold">
          Ocurrió un error al cargar tus favoritos.
        </ThemedText>
        <ThemedText className="text-gray-500 text-center mt-2">
          Ocurrió un error inesperado, intenta de nuevo.
        </ThemedText>
      </ThemedView>
    );
  }

  const handleEndReached = () => {
    // Carga la siguiente página si existe y no está actualmente cargando
    if (hasNextPage && !favoriteQuery.isFetchingNextPage) {
      loadNextPage();
    }
  };

  const onPullToRefresh = async () => {
    setIsRefreshing(true);
    // Usamos invalidateQueries en la clave de consulta específica
    await queryClient.invalidateQueries({ queryKey: currentQueryKey });
    setIsRefreshing(false);
  };

  // --- Renderizado del Footer de Carga ---
  const renderFooter = () => {
    if (favoriteQuery.isFetchingNextPage) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#f43f5e" />
        </View>
      );
    }
    return null;
  };

  return (
    <View className="pt-8 flex-1 bg-light-background dark:bg-dark-background">
      <PlayerBackground style={{ position: "absolute", inset: 0 }} />
      <View className="flex">
        <ThemedText className="text-center text-xl font-bold shadow-xl">
          Favoritos
        </ThemedText>
        <View className="mx-3 mt-3">
          <ThemedText className="text-lg">
            Conecta con lo que te gusta
          </ThemedText>
          <ThemedText className="mb-3">Disfruta de tus favoritos</ThemedText>
        </View>
      </View>

      {/* --- 3. Botones de Filtro --- */}
      <View style={styles.filterButtons}>
        <TouchableOpacity
          className="active:opacity-90"
          onPress={() => setSelectedType("radio")}
          style={[
            styles.button,
            selectedType === "radio" && styles.buttonActive,
          ]}
        >
          <ThemedText
            style={
              selectedType === "radio"
                ? styles.buttonTextActive
                : styles.buttonText
            }
          >
            Radios Favoritas
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedType("podcast")}
          style={[
            styles.button,
            selectedType === "podcast" && styles.buttonActive,
          ]}
        >
          <ThemedText
            style={
              selectedType === "podcast"
                ? styles.buttonTextActive
                : styles.buttonText
            }
          >
            Podcasts Favoritos
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* --- 4. FlatList de Favoritos --- */}
      <FlatList
        data={allFavorites}
        numColumns={3}
        keyExtractor={(item) => item.id}
        key={selectedType} // Cambiar key fuerza a FlatList a re-renderizar al cambiar el tipo
        renderItem={({ item }) => (
          <FavoriteGridItem
            item={item}
            queryKey={currentQueryKey}
            // onRemove={() => removeFavorite(item.type, item.id)}
            // onRemove={() =>
            // 	useFavoritesStore.getState().removeFavorite(item.type, item.id)
            // }
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No tienes {selectedType === "radio" ? "radios" : "podcasts"} en tus
            favoritos.
          </ThemedText>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onPullToRefresh}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}
// --- Estilos simulados (Ajusta estos a tu StyleSheet de React Native) ---
const styles = StyleSheet.create({
  text: {
    color: "#333",
    textAlign: "center",
  },
  view: {
    backgroundColor: "transparent",
  },

  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 10,
  },

  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  buttonActive: {
    backgroundColor: "#f43f5e", // Color primario
  },
  buttonText: {
    color: "#333",
    fontWeight: "600",
  },
  buttonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 260,
    paddingTop: 10,
  },
  gridItem: {
    flex: 1,
    margin: 5,
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 6,
    marginBottom: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    minHeight: 30, // Evita CLS
  },
  subtitle: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
  },
  emptyText: {
    alignItems: "center",
    marginTop: 50,
    fontSize: 18,
    color: "#999",
    marginHorizontal: "auto",
  },
});
