//  ERROR  VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead.

import ThemedText from "@/presentation/theme/components/themed-text";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useTopPodcast } from "../hooks/useTopPodcast";
import PodcastGridItem from "./PodcastGridItem";

// Call Stack

export const TopPodcast = () => {
  const { topPodcastQuery } = useTopPodcast();

  const allTop: any[] = Array.isArray(topPodcastQuery.data)
    ? topPodcastQuery.data
    : [];

  if (topPodcastQuery.isLoading) {
    return (
      <View className="flex items-center justify-center py-6">
        <ActivityIndicator size="small" color="#f43f5e" />
      </View>
    );
  }

  if (topPodcastQuery.isError) {
    return <ThemedText className="p-4">Error al cargar Top 9.</ThemedText>;
  }

  return (
    <View>
      <ThemedText className="text-lg font-bold ml-4 mb-1 mt-6">
        Top 9 Podcasts Más Populares🔥
      </ThemedText>
      <FlatList
        data={allTop}
        numColumns={3}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PodcastGridItem podcast={item} />}
        contentContainerStyle={{ paddingHorizontal: 1 }}
      />
    </View>
  );
};
