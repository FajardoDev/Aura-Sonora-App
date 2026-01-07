/* eslint-disable react-hooks/exhaustive-deps */
import { Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import GridRadioCategory from "@/presentation/radio/components/GridRadioCategory";
import { useRadioCategory } from "@/presentation/radio/hooks/useRadioByCategory";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, View } from "react-native";

export default function ScreemCategoryRadio() {
  const { categoria } = useLocalSearchParams<{ categoria: string }>();

  const { RadioCategoryQuery, hasNextPage, isFetching, loadNextPage } =
    useRadioCategory(categoria);

  console.log(categoria);

  useFocusEffect(
    useCallback(() => {
      RadioCategoryQuery.refetch();
      return () => {};
    }, [RadioCategoryQuery.refetch]) // Dependencia simplificada
  );
  if (RadioCategoryQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color={"#e11d48"} />
        <ThemedText> categoria... 📻</ThemedText>
      </View>
    );
  }

  if (RadioCategoryQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ThemedText className="text-center">
          No se pudieron cargar la radio por categoria🎼🎶
        </ThemedText>
      </View>
    );
  }

  const allRadios: Station[] =
    RadioCategoryQuery.data?.pages.flatMap(
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
        <GridRadioCategory
          radios={allRadios}
          loadNextPage={loadNextPage}
          hasNextPage={hasNextPage}
          isSearching={RadioCategoryQuery.isFetchingNextPage}
          isFetching={isFetching}
          category={categoria}
        />
      </View>
    </>
  );
}
