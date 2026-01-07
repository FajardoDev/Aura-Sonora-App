/* eslint-disable react-hooks/exhaustive-deps */
import { categories } from "@/assets/data/categorias";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  // Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { usePopularCategoriesStation } from "../hooks/usePopularCategoriesStation";

// Lista de categorías que tienen imágenes con la extensión .jpg
const jpgCategories = new Set([
  "60s",
  "2000s",
  "alternative",
  "bachata",
  "techno",
  "balada",
  "bossa-nova",
  "christian",
  "christian-contemporary",
  "comedy",
  "culture",
  "eclectic",
  "entertainment",
  "funk",
  "gospel",
  "instrumental",
  "jazz",
  "latin",
  "news",
  "oldies",
  "politics",
  "pop",
  "salsa",
  "soul",
  "spanish",
  "talk",
  "top40",
  "vallenato",
]);

interface Props {
  id: string;
  name: string;
}

const CategoryImage = ({ id, name }: Props) => {
  // Construye la URL de la imagen en Cloudinary
  const extension = jpgCategories.has(id) ? "jpg" : "png";
  const imageSrc = `https://res.cloudinary.com/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/categories/${id}.${extension}`;

  return (
    <Image
      source={imageSrc}
      contentFit="cover"
      style={{ width: 80, height: 80, borderRadius: 40 }}
      // className="h-20 w-20 rounded-full object-cover mb-2"
      transition={500}
      placeholder={require("../../../assets/images/radios.png")}
      priority="high"
    />
  );
};

export const PopularCategoriesStation = () => {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const { popularCategoriesStationQuery } = usePopularCategoriesStation();
  // 🔹 Datos de tu API
  // const apiCategories = popularCategoriesStationQuery.data ?? [];
  const apiCategories: any[] = Array.isArray(popularCategoriesStationQuery.data)
    ? popularCategoriesStationQuery.data
    : [];

  useFocusEffect(
    useCallback(() => {
      popularCategoriesStationQuery.refetch(); //🚀 Esto garantiza que la solicitud se dispare
      return () => {}; // Función de limpieza, aunque no hace falta lógica aquí
    }, [popularCategoriesStationQuery.refetch]) // Dependencia simplificada
  );

  // 🔹 Combina los datos del backend con tus categorías locales
  const mergedCategories = useMemo(() => {
    return apiCategories
      .map((apiCat) => {
        const localCat = categories.find(
          (cat) => cat.name?.toLowerCase() === apiCat.category?.toLowerCase()
        );
        if (!localCat) return null;
        return {
          id: localCat.id,
          name: localCat.name,
          description: localCat.description,
          favorites: apiCat.favorites,
          comments: apiCat.comments,
          averageRating: apiCat.averageRating,
          totalStations: apiCat.totalStations,
          popularityScore: apiCat.popularityScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b?.popularityScore - a?.popularityScore) // ordena por popularidad
      .slice(0, 15); // 🔹 solo las top 15 categorías
  }, [apiCategories]);

  if (popularCategoriesStationQuery.isLoading) {
    return (
      <View className="flex items-center justify-center py-6">
        <ActivityIndicator size="small" color="#f43f5e" />
      </View>
    );
  }

  if (popularCategoriesStationQuery.isError) {
    return <ThemedText className="p-4">Error al cargar categorías.</ThemedText>;
  }

  const handlePress = (name: string) => {
    const targetPath = `/radio-station/categoria/${name.toLowerCase()}`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  return (
    <View className="mt-6">
      <ThemedText className="text-lg font-bold mb-3 mx-4">
        Lo que más suena 🔥
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-1 pb-5"
      >
        {mergedCategories.map((cat) => (
          <TouchableOpacity
            onPress={() => handlePress(cat?.name ?? "")}
            key={cat?.id}
            activeOpacity={0.9}
            className="bg-neutral-900 rounded-2xl mr-2 w-36 p-3 items-center shadow-slate-300"
          >
            <CategoryImage id={cat?.id ?? ""} name={cat?.name ?? ""} />
            <ThemedText
              className="text-white font-semibold text-sm text-center capitalize mt-1"
              numberOfLines={1}
            >
              {cat?.name}
            </ThemedText>

            {cat?.favorites > 0 && (
              <View className="mt-1 flex-row items-center">
                <ThemedText className="text-neutral-400 text-xs mr-[2px]">
                  {cat?.favorites}
                </ThemedText>
                <Ionicons name="heart" size={14} color="#ef4444" />
              </View>
            )}

            {/* {cat?.favorites && (
              <View className="mt-1 flex-row items-center">
                <ThemedText className="text-neutral-400 text-xs mr-[2px]">
                  {cat?.favorites}
                </ThemedText>

                <Ionicons name={"heart"} size={14} color="#ef4444" />
              </View>
            )} */}

            <ThemedText className="text-neutral-400 text-xs mt-[2px]">
              {cat?.totalStations} emisoras
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

/*
[ 'News', 'Entertainment', 'Technology' ]
[ 'Christianity', 'Religion', 'Spirituality' ]
[ 'Comedy', 'Improv' ]
[ 'Education', 'Self Improvement' ]
[ 'Fiction', 'Science' ]
[ 'News' ]
[ 'Business' ]
[ 'Health', 'Fitness', 'Mental' ]
[ 'News', 'Daily' ]
[ 'Health', 'Fitness', 'Medicine' ]
[ 'Business', 'Education', 'History' ]
[ 'Comedy', 'Interviews', 'Society', 'Culture', 'Personal' ]
[ 'Business', 'Society', 'Culture' ]
[ 'Arts', 'Music', 'Sports', 'Tv' ]
[ 'Health', 'Fitness', 'Mental' ]
[ 'News', 'Daily' ]
[ 'Education' ]
[ 'Society', 'Culture' ]
[ 'Education', 'Kids', 'Family', 'Stories' ]
[ 'Christianity', 'Religion', 'Spirituality' ]
[ 'Society', 'Culture' ]
[ 'Health', 'Fitness', 'Mental' ]
[ 'Comedy', 'Society', 'Culture' ]
[ 'Business' ]
[ 'Christianity', 'Religion', 'Spirituality' ]
[ 'Education' ]
[ 'Comedy' ]
[ 'Business', 'Entrepreneurship' ]
[ 'Health', 'Fitness', 'Nutrition' ]
[ 'Education' ]
[ 'Society', 'Culture' ]
[ 'Comedy' ]
[ 'Arts', 'Food', 'Education', 'How To' ]
[ 'Society', 'Culture' ]
[ 'Technology' ]

* */
