import { Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import RadioGridItem from "./RadioGridItem";

interface Props {
  emisoras: Station[]; // Array de estaciones individuales
  loadNextPage: () => void;
  hasNextPage: boolean;
  isSearching: boolean;
}

export const RadioGrid = ({
  emisoras,
  loadNextPage,
  hasNextPage,
  isSearching,
}: Props) => {
  const { streamUrl } = useAudioPlayerStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // fn para cuando retorna despues de cargar borrar cache
  const onPullToRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    queryClient.invalidateQueries({
      queryKey: ["radioStations", "infinite"],
    });

    setIsRefreshing(false);
  };

  // 💡 RENDERIZADO DEL FOOTER
  const renderFooter = () => {
    // Muestra el loader solo si hay más páginas y estamos cargando la siguiente
    if (isSearching) {
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator size="small" color="#f43f5e" />
        </View>
      );
    }

    // Si no hay más páginas y hay contenido, mostrar mensaje de fin
    if (!hasNextPage && emisoras.length > 0) {
      return (
        <ThemedText className="py-5 text-center text-gray-500 dark:text-gray-400 text-sm mb-5">
          — Fin de radios —
        </ThemedText>
      );
    }
    return null;
  };

  const handleEndReached = () => {
    // Solo intenta cargar si hay más páginas y no está ya cargando
    if (hasNextPage && !isSearching) {
      loadNextPage();
    }
  };

  return (
    <FlatList
      data={emisoras}
      numColumns={3}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <RadioGridItem emisora={item} index={index} />
      )}
      // Al 80% de la screen empieza a cargar
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.8}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onPullToRefresh} />
      }
      contentContainerStyle={{
        paddingHorizontal: 0,
        paddingBottom: streamUrl ? 300 : 220,
      }}
    />
  );
};
