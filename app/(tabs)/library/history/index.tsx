import { useHistoryPage } from "@/core/radio-podcast/actions/radio-podcast/hooks/useHistorys";

import { EntityType } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import HistoryGridItem from "@/presentation/radio-podcast/HistoryGridItem";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import NetInfo from "@react-native-community/netinfo";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TabsHistoryScreem() {
  const [selectedType, setSelectedType] = useState<EntityType>("radio");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient(); // Necesario para la invalidación

  const { isConnected } = useNetworkStatus();

  const { allHistorys, hasNextPage, historysQuery, loadNextPage } =
    useHistoryPage(selectedType as any);

  useFocusEffect(
    useCallback(() => {
      historysQuery.refetch();
      return () => {};
    }, [historysQuery.refetch]) // Dependencia simplificada
  );

  // Clave de consulta específica para el tipo seleccionado
  const currentQueryKey = ["historys", "page", selectedType];

  if (
    isConnected === null ||
    (historysQuery.isLoading && historysQuery.isFetchingNextPage === false)
  ) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color="#f43f5e" />
        <ThemedText style={{ marginTop: 10 }}>
          Cargando historial... 🕐
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
            historysQuery.refetch(); // solo si realmente hay conexión
          }}
        />
      </View>
    );
  }

  if (historysQuery.isError) {
    return (
      <ThemedView className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ThemedText text-lg font-semibold>
          Ocurrió un error al cargar historial.
        </ThemedText>

        <ThemedText className="text-gray-500 text-center mt-2">
          Ocurrió un error inesperado, intenta de nuevo.
        </ThemedText>
      </ThemedView>
    );
  }

  const handleEndReached = () => {
    // Carga la siguiente página si existe y no está actualmente cargando
    if (hasNextPage && !historysQuery.isFetchingNextPage) {
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
    if (historysQuery.isFetchingNextPage) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#f43f5e" />
        </View>
      );
    }

    // Si no hay más páginas y hay contenido, mostrar mensaje de fin
    if (!hasNextPage && allHistorys.length > 0) {
      return (
        <Text className="py-5 text-center text-gray-500 dark:text-gray-400 text-sm">
          — Fin del historial —
        </Text>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background">
      <PlayerBackground style={{ position: "absolute", inset: 0 }} />
      <View className="px-5">
        <ThemedText type="h1">Tu Historial de Reproducción</ThemedText>
        <ThemedText className="">
          Descubre lo que escuchaste recientemente.
        </ThemedText>
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
            Historial Radios
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
            Historial Podcasts
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* --- 4. FlatList de Favoritos --- */}
      <FlatList
        data={allHistorys}
        numColumns={3}
        keyExtractor={(item) => item.id}
        key={selectedType} // Cambiar key fuerza a FlatList a re-renderizar al cambiar el tipo
        renderItem={({ item }) => (
          <HistoryGridItem item={item} queryKey={currentQueryKey} />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No haz reproducido ningun{" "}
            {selectedType === "radio" ? "radios" : "podcasts"} en tus historial.
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
    marginTop: 20,
    fontSize: 18,
    color: "#999",
    marginHorizontal: "auto",
  },
});
