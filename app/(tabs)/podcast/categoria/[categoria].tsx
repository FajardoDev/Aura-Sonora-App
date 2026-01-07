import { Podcasts } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import GridPodcastCategory from "@/presentation/podcast/components/GridPodcastCategory";
import { usePodcastCategory } from "@/presentation/podcast/hooks/usePodcastByCategory";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, View } from "react-native";

export default function CategoriaDetail() {
  const { categoria } = useLocalSearchParams<{ categoria: string }>();

  const { hasNextPage, isFetching, loadNextPage, podcastCategoryQuery } =
    usePodcastCategory(categoria);

  console.log(categoria);

  useFocusEffect(
    useCallback(() => {
      podcastCategoryQuery.refetch();
      return () => {};
    }, [podcastCategoryQuery.refetch]) // Dependencia simplificada
  );
  if (podcastCategoryQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator />
        <ThemedText> categoria... 🎙</ThemedText>
      </View>
    );
  }

  if (podcastCategoryQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ThemedText className="text-center">
          No se pudieron cargar los podcast por categoria🎼🎶
        </ThemedText>
      </View>
    );
  }

  const allPodcast: Podcasts[] =
    podcastCategoryQuery.data?.pages.flatMap(
      (page) => page.data // <-- Accede a 'podcast' dentro de cada 'page'
    ) ?? ([] as any);

  return (
    <>
      <Stack.Screen
        options={{
          title: categoria ?? "Categoría",
          headerShown: true, // si quieres mostrarlo
        }}
      />

      <View className="flex-1 bg-light-background dark:bg-dark-background mt-1">
        <GridPodcastCategory
          podcasts={allPodcast}
          loadNextPage={loadNextPage}
          hasNextPage={hasNextPage}
          isSearching={podcastCategoryQuery.isFetchingNextPage}
          isFetching={isFetching}
          category={categoria}
        />
      </View>
    </>
  );
}
