import { Podcasts } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import PodcastGridItem from "./PodcastGridItem";

interface Props {
  podcasts: Podcasts[];
  loadNextPage: () => void;
  hasNextPage: boolean;
  isSearching: boolean; // isFetchingNextPage
  isFetching: boolean; // isFetching
  category: string;
}

export default function GridPodcastCategory({
  hasNextPage,
  isFetching,
  isSearching,
  loadNextPage,
  podcasts,
  category,
}: Props) {
  const { streamUrl } = useAudioPlayerStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Evita que onEndReached se dispare múltiples veces seguidas
  const onEndReachedCalledDuringMomentum = useRef(true);

  // fn para cuando retorna despues de cargar borrar cache
  const onPullToRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    queryClient.invalidateQueries({
      queryKey: ["podcastcat", "infinite", category],
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
    if (!hasNextPage && podcasts.length > 0) {
      return (
        <ThemedText className="py-5 text-center text-gray-500 dark:text-gray-400 text-sm">
          — Fin de categoria —
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

  // const handleEndReached = () => {
  // 	if (!onEndReachedCalledDuringMomentum.current) {
  // 		if (hasNextPage && !isSearching) {
  // 			loadNextPage();
  // 		}
  // 		onEndReachedCalledDuringMomentum.current = true;
  // 	}
  // };

  // si no hay items mostramos un placeholder amable
  if (!podcasts || podcasts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        {isFetching ? (
          <ActivityIndicator color="#f43f5e" />
        ) : (
          <ThemedText>No hay podcasts en esta categoría.</ThemedText>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={podcasts}
      numColumns={3}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <PodcastGridItem podcast={item} index={index} />
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
      // Previene doble trigger: react native dispara onEndReached al montar; controlamos con momentum
      onMomentumScrollBegin={() => {
        onEndReachedCalledDuringMomentum.current = false;
      }}
    />
  );
}
