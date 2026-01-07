import ThemedText from "@/presentation/theme/components/themed-text";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useTopStation } from "../hooks/useTopStation";
import RadioGridItem from "./RadioGridItem";

//  ERROR  VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead.

// Call Stack

export const TopStation = () => {
  const { topStationQuery } = useTopStation();

  const allTop: any[] = Array.isArray(topStationQuery.data)
    ? topStationQuery.data
    : [];

  if (topStationQuery.isLoading) {
    return (
      <View className="flex items-center justify-center py-6">
        <ActivityIndicator size="small" color="#f43f5e" />
      </View>
    );
  }

  if (topStationQuery.isError) {
    return <ThemedText className="p-4">Error al cargar Top 10.</ThemedText>;
  }

  return (
    <View>
      <ThemedText className="text-lg font-bold ml-4 mb-1 mt-6">
        Top 9 Emisoras Más Populares🔥
      </ThemedText>
      <FlatList
        data={allTop}
        numColumns={3}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <RadioGridItem emisora={item} />}
        contentContainerStyle={{ paddingHorizontal: 1 }}
      />
    </View>
  );
};
