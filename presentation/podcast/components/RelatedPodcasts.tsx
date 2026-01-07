import { RelatedPodcast } from "@/core/radio-podcast/interface/podcast/podcast-responce-by-id.interface";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useEffect, useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import PodcastPoster from "./PodcastPoster";

interface Props {
  podcast: RelatedPodcast[];
  title?: string;
  despription?: string;
  className?: string;
  loadNextPage?: () => void;
}

export default function RelatedPodcasts({
  podcast,
  className,
  despription,
  loadNextPage,
  title,
}: Props) {
  const isLoading = useRef(false);

  useEffect(() => {
    setTimeout(() => {
      isLoading.current = false;
    }, 200);
  }, [podcast]);

  // Determinar el final de la listScroll
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isLoading.current) return;

    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;

    // Determinar si estoy cerca del final del scroll
    const estaCerca =
      contentOffset.x + layoutMeasurement.width + 600 >= contentSize.width;

    if (!estaCerca) return;

    isLoading.current = true;
    console.log("Cargar el siguientes podcast");

    loadNextPage && loadNextPage(); // Si hay un valor ejacuta la fn

    // isLoading.current = false;
  };

  // 🔄 Aplanar las estaciones para que FlatList tenga una sola lista de items
  const flattenedPodcast = podcast.flatMap((group) => group.items);

  return (
    <ThemedView className="px-2 mt-6">
      {/* <Text className="text-white text-lg font-semibold mb-3 mx-3">
				Podcasts relacionados
			</Text> */}

      {title && (
        <ThemedText className="mt-7 mx-4 font-Roboto-Medium text-lg">
          {title}
        </ThemedText>
      )}

      {despription && (
        <ThemedText className="mx-4 mb-2">{despription}</ThemedText>
      )}

      <FlatList
        horizontal
        data={flattenedPodcast}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={({ item }) => (
          <PodcastPoster
            title={item.titleEncabezado}
            podcast={item}
            poster={item.image}
            smallPoster={true}
          />
        )}
        onScroll={onScroll}
      />
    </ThemedView>
  );
}
