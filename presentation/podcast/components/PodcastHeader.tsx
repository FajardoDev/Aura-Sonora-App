import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { Podcast } from "@/core/radio-podcast/interface/podcast/podcast-responce-by-id.interface";
import { EntityType } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { TouchableOpacity } from "react-native";
import { getImageUrl } from "./PodcastGridItem";

interface Props {
  podcast: Podcast;
}

export default function PodcastHeader({ podcast }: Props) {
  const { mutate, isPending } = useToggleFavorite();

  const uri = getImageUrl(podcast.image);

  const handleToggleFavorite = () => {
    const payload = {
      type: "podcast" as EntityType,
      podcastId: podcast.id,
      radioSlug: podcast.slug,
    };
    // console.log(`[LOG] Iniciando mutación optimista para ID: ${podcast.id}`);
    mutate(payload);
  };

  return (
    <ThemedView className="p-3">
      {/* Gradiente sutil detrás del header */}
      <LinearGradient
        colors={["#00000060", "#00000000"]}
        className="absolute top-0 left-0 right-0 h-40 rounded-b-3xl"
      />

      {/* Contenedor principal */}
      <ThemedView className="flex-row items-center rounded-2xl dark:bg-white/10  backdrop-blur-md shadow-lg p-3 shadow-white/20">
        <ThemedView className="relative w-[30%] h-[170px] rounded-md">
          {/* Contenedor de imagen */}
          <ThemedView className="rounded-md">
            <Image
              source={
                podcast.image
                  ? { uri, cache: "force-cache" }
                  : require("../../../assets/images/radio-podcast.jpg")
              }
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
              }}
              className="w-28 h-28 rounded-md overflow-hidden"
              contentFit="cover" // mejor que resizeMode
              transition={500} // fade suave al cargar
              placeholder={require("../../../assets/images/podcasts.png")}
              priority="high" // alta prioridad de carga
            />

            {/* ❤️ Botón de favoritos arriba a la derecha */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleFavorite} // Llama a la función de toggle
              disabled={isPending} // Deshabilitar mientras la mutación está en curso (opcional)
              style={{
                position: "absolute",
                top: 2,
                right: 1,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 999,
                padding: 6,
                zIndex: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={podcast.isFavorite ? "heart" : "heart-outline"}
                size={18}
                color="#ef4444"
              />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        {/* Info del podcast */}
        <ThemedView className="flex-1 pl-4 rounded-md">
          <ThemedText className="text-xl font-bold" numberOfLines={2}>
            {podcast.titleEncabezado}
          </ThemedText>

          {/* Categorías */}
          {/* 🎧 Categorías del podcast */}
          <ThemedView className="flex-row flex-wrap mt-2">
            {podcast.categories?.map((cat: string, index: number) => (
              <Link key={index} href={`/podcast/categoria/${cat}`} asChild>
                <TouchableOpacity
                  className="dark:bg-white/10 bg-light-icon/5  rounded-full shadow-black shadow-2xl px-3 py-1 mr-2 mb-2"
                  // style={({ pressed }) => ({
                  //   opacity: pressed ? 0.4 : 1,
                  //   elevation: 10,
                  //   boxShadow: "2px 2px 5px #011016",
                  //   shadowColor: "#000",
                  // })}
                >
                  <ThemedText className="text-xs font-medium">{cat}</ThemedText>
                </TouchableOpacity>
              </Link>
            ))}
          </ThemedView>
          {/* <View className="flex-row flex-wrap mt-1">
						{podcast.categories.map((cat, index) => (
							<Text
								key={index}
								className="text-xs text-gray-300 mr-2 bg-white/10 px-2 py-1 rounded-full mb-2"
							>
								{cat}
							</Text>
						))}
					</View> */}

          <ThemedText className="text-sm mt-1">
            {podcast.titleSecond}
          </ThemedText>
          {/* <Text className="text-sm text-gray-300 mt-1">
						Con Juan Pérez · 120 episodios
					</Text> */}

          <ThemedText className="text-xs  mt-2 leading-5" numberOfLines={3}>
            {podcast.description}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
