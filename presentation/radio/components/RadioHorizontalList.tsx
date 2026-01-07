import { RelatedStations } from "@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useEffect, useRef } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from "react-native";
import RadioPoster from "./RadioPoster";

interface Props {
  title?: string;
  despription?: string;
  radios: RelatedStations[];
  className?: string;

  loadNextPage?: () => void;
}

export default function RadioHorizontalList({
  radios,
  title,
  despription,
  className,
  loadNextPage,
}: Props) {
  const isLoading = useRef(false);

  useEffect(() => {
    setTimeout(() => {
      isLoading.current = false;
    }, 200);
  }, [radios]);

  // Determinar el final de la listScroll
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isLoading.current) return;

    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;

    // Determinar si estoy cerca del final del scroll
    const estaCerca =
      contentOffset.x + layoutMeasurement.width + 600 >= contentSize.width;

    if (!estaCerca) return;

    isLoading.current = true;
    console.log("Cargar siguientes emisoras");

    loadNextPage && loadNextPage(); // Si hay un valor ejacuta la fn

    // isLoading.current = false;
  };

  // 🔄 Aplanar las estaciones para que FlatList tenga una sola lista de items
  const flattenedRadios = radios.flatMap((group) => group.items);

  return (
    <View className={`${className}`}>
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
        data={flattenedRadios}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={({ item }) => (
          <RadioPoster
            title={item.radioname}
            emisoras={item as any}
            poster={item.radioimg}
            smallPoster={true}
          />
        )}
        // refreshControl={
        // 	<RefreshControl refreshing={isRefreshing} onRefresh={onPullToRefresh} />
        // }

        onScroll={onScroll}
      />
    </View>
  );
}
