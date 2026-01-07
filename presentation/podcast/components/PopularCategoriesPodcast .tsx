/* eslint-disable react-hooks/exhaustive-deps */
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { usePopularCategoriesPodcast } from "../hooks/usePopularCategoriesPodcast";

// 🎨 Colores base (puedes agregar más tonos)
const COLORS = [
  "#F87171", // rojo
  "#FBBF24", // amarillo
  "#34D399", // verde
  "#60A5FA", // azul
  "#A78BFA", // púrpura
  "#F472B6", // rosa
  "#F59E0B", // naranja
  "#10B981", // esmeralda
];

// 🔹 genera un color consistente según el nombre
const getCategoryColor = (name: string) => {
  const index = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[index % COLORS.length];
};

// 🔹 componente visual para cada categoría
const PodcastCategoryCard = ({
  name,
  totalPodcasts,
  favorites,
}: {
  name: string;
  totalPodcasts: number;
  favorites: number;
}) => {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const color = getCategoryColor(name);

  const handlePress = () => {
    const targetPath = `/podcast/categoria/${name}`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="rounded-2xl p-3 mr-2 w-36 items-center justify-center bg-black/90"
      // style={{ backgroundColor: color + "33" }} // color translúcido
      activeOpacity={0.9}
    >
      <View
        className="h-20 w-20 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: color }}
      >
        <ThemedText className="text-white font-bold text-sm" numberOfLines={1}>
          {name[0].toUpperCase()}
        </ThemedText>
      </View>
      <ThemedText className="text-white font-semibold text-sm text-center capitalize">
        {name}
      </ThemedText>

      {favorites > 0 && (
        <View className="mt-1 flex-row items-center">
          <ThemedText className="text-neutral-400 text-xs mr-[2px]">
            {favorites}
          </ThemedText>
          <Ionicons name="heart" size={14} color="#ef4444" />
        </View>
      )}

      {/* {favorites && (
        <>
          <View className="text-neutral-400 text-xs mt-1 flex-row items-center">
            <ThemedText className="text-neutral-400 text-xs mr-[2px]">
              {favorites}
            </ThemedText>
            <Ionicons name={"heart"} size={14} color="#ef4444" />
          </View>
        </>
      )} */}

      <ThemedText className="text-neutral-300 text-xs mt-1">
        {totalPodcasts} podcasts
      </ThemedText>
    </TouchableOpacity>
  );
};

export const PopularCategoriesPodcast = () => {
  const { popularCategoriesPodcastQuery } = usePopularCategoriesPodcast();

  const apiCategories = Array.isArray(popularCategoriesPodcastQuery.data)
    ? popularCategoriesPodcastQuery.data
    : [];

  // Combinar y limpiar categorías
  const mergedCategories = useMemo(() => {
    return apiCategories
      .map((apiCat) => ({
        name: apiCat.category,
        totalPodcasts: apiCat.totalStations ?? 0,
        popularityScore: apiCat.popularityScore ?? 0,
        favorites: apiCat.favorites,
      }))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 15);
  }, [apiCategories]);

  if (popularCategoriesPodcastQuery.isLoading) {
    return (
      <View className="flex items-center justify-center py-6">
        <ActivityIndicator size="small" color="#f43f5e" />
      </View>
    );
  }

  if (popularCategoriesPodcastQuery.isError) {
    return <ThemedText className="p-4">Error al cargar categorías.</ThemedText>;
  }

  return (
    <View className="mt-6">
      <ThemedText className="text-lg font-bold mb-3 mx-4">
        Categorías populares 🎧
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-1 pb-5"
      >
        {mergedCategories.map((cat, index) => (
          <PodcastCategoryCard
            key={index}
            name={cat.name}
            favorites={cat.favorites}
            totalPodcasts={cat.totalPodcasts}
          />
        ))}
      </ScrollView>
    </View>
  );
};
