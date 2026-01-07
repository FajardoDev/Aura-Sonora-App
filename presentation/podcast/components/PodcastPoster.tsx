import { EntityType } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
// import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { Podcast } from "@/core/radio-podcast/interface/podcast/podcast-responce-by-id.interface";
import { RatingStars } from "@/presentation/radio/components/RatingStars";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { getImageUrl } from "./PodcastGridItem";

interface Props {
  podcast?: Podcast;
  title: string;
  poster: string;
  smallPoster?: boolean;
  className?: string;
}

export default function PodcastPoster({
  podcast,
  poster,
  smallPoster = false,
  className,
  title,
}: Props) {
  const podcasts = podcast!;

  //! 📍
  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();

  // Evitar multiples clic
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  //! 📍
  const handleToggleFavorite = () => {
    if (!podcasts || isPending) return;
    const payload = {
      type: "podcast" as EntityType,
      radioSlug: podcasts.slug,
      podcastId: podcasts.id,
      // source: "detail", // 👈 AGREGA ESTO
    };
    console.log("Payload enviado:", payload);
    mutate(payload);
  };

  // Esto previene que el botón se use antes de que la data cargue
  const isDisabled = !podcasts || isPending;

  const img = getImageUrl(podcasts.image);

  const handlesClic = () => {
    const targetPath = `/podcast/${podcasts.slug}`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const handlePress = () => {
    const targetPath = `/podcast/${podcasts.slug}/#comments`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  return (
    <ThemedView
      style={{
        // width: "30%",
        margin: 5,
        backgroundColor: "#011016",
        borderRadius: 12,
        shadowColor: "#000",
        boxShadow: "2px 2px 5px #011016",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Contenedor de imagen */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlesClic}
        // disabled={}

        style={{ position: "relative" }}
      >
        {/* Imagen de la emisora */}
        {/* <Image
					source={{ uri: img }}
					className="shadow-lg rounded-t-lg shadow-black w-full h-full"
					style={{
						width: "90%",
						height: 90,
						// width: smallPoster ? 160 : 260,
						// height: smallPoster ? 85 : 160,
						opacity: isCurrentStation && isPlaying ? 0.25 : 1,
					}}
					resizeMode="cover"
				/> */}

        <Image
          source={
            img
              ? { uri: img, cache: "force-cache" }
              : require("../../../assets/images/radio-podcast.jpg")
          }
          style={{
            width: "100%",
            height: 120,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            // width: 160,
            // height: 100,
            // borderTopLeftRadius: 12,
            // borderTopRightRadius: 12,
          }}
          contentFit="cover" // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={require("../../../assets/images/podcasts.png")}
          priority="high" // alta prioridad de carga
        />

        {/* ❤️ Botón de favoritos arriba a la derecha */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleFavorite} // Llama a la función de toggle
          disabled={isDisabled} // Deshabilitar mientras la mutación
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
            name={podcasts.isFavorite ? "heart" : "heart-outline"}
            size={18}
            color="#ef4444"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Detalles del podcast */}
      <TouchableOpacity
        onPress={handlePress}
        style={{
          paddingTop: 5,
          paddingBottom: 5,
          backgroundColor: "#0c0c0cdf",
          width: 125,
          // backgroundColor: "#f9fafb",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
        // style={{
        //   paddingTop: 3,
        //   paddingBottom: 4,
        //   // backgroundColor: "#f9fafb",
        //   borderBottomLeftRadius: 12,
        //   borderBottomRightRadius: 12,
        // }}
      >
        <View className="p-1">
          <ThemedText
            numberOfLines={1}
            className="text-white font-Roboto-SemiBold  mb-1"
            // style={styles.titleText}
          >
            {podcasts.titleEncabezado}
          </ThemedText>
          {podcasts.titleSecond && (
            <ThemedText
              numberOfLines={2}
              // style={styles.titleText}
              className="text-white text-xs leading-tight"
            >
              {podcasts.titleSecond}
            </ThemedText>
          )}
        </View>

        {podcasts.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-sm text-white pr-[2px]">
              {podcasts.averageRating.toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={podcasts.averageRating}
              commentsCount={podcasts.commentsCount}
            />
          </View>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}
