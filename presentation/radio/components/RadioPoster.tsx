import {
  EntityType,
  Station,
} from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
// import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
// import { Image } from "expo-image";
import { useRegisterLatestView } from "@/core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import { RatingStars } from "./RatingStars";

interface Props {
  emisoras?: Station;
  title: string;
  poster: string;
  smallPoster?: boolean;
  className?: string;
}

export default function RadioPoster({
  emisoras,
  poster,
  smallPoster = false,
  className,
  title,
}: Props) {
  const emisora = emisoras!;

  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const [activated, setActivated] = useState(false);

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  //! 📍
  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();

  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const isCurrentStation = streamUrl === emisora.stream;

  //! 📍
  const handleToggleFavorite = () => {
    if (!emisora || isPending) return;
    const payload = {
      type: "radio" as EntityType,
      radioSlug: emisora.slug,
      radioStationId: emisora.id,
      // source: "detail", // 👈 AGREGA ESTO
    };
    console.log("Payload enviado:", payload);
    mutate(payload);
  };

  // Esto previene que el botón se use antes de que la data cargue
  const isDisabled = !emisora || isPending;

  useEffect(() => {
    if (!isCurrentStation && activated) {
      setActivated(false);
    }
  }, [isCurrentStation, activated]);

  const handlePlayClick = () => {
    if (isCurrentStation) {
      // Si es la misma emisora → alternar play/pause
      togglePlay();
    } else {
      // Si es otra → configurar nueva emisora
      setStream(
        emisora.stream,
        emisora.radioname,
        emisora.radioimg,
        emisora.slug,
        emisora.radioid,
        emisora.id,
        // emisora.isFavorite,
        "radio"
      );

      if (user && status === "authenticated" && streamUrl !== emisora.stream) {
        try {
          // Registrar la última vista
          registerView({
            type: "radio",
            radioStationId: emisora.id,
          });
        } catch (error) {
          console.error("Error al registrar reproducción:", error);
        }
      }
      setActivated(true);
    }
  };

  const handlePress = () => {
    const targetPath = `/radio-station/${emisora.slug}/#comments`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const shouldShowButton = isCurrentStation || activated;

  return (
    <View
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
        onPress={handlePlayClick}
        style={{ position: "relative" }}
      >
        {/* Imagen de la emisora */}
        {/* <Image
          source={{ uri: poster }}
          className="shadow-lg rounded-t-lg shadow-black w-full h-full"
          style={{
            width: smallPoster ? 160 : 260,
            height: smallPoster ? 85 : 160,
            opacity: isCurrentStation && isPlaying ? 0.25 : 1,
          }}
          resizeMode="cover"
        /> */}

        <Image
          source={
            emisora.radioimg
              ? { uri: emisora.radioimg, cache: "force-cache" }
              : require("../../../assets/images/radio-studio.jpg")
          }
          // className="h-20 w-20 rounded-full object-cover mb-2"
          style={{
            // width: "100%",
            // height: 65,
            width: "100%",
            height: 70,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            opacity: isCurrentStation && isPlaying ? 0.25 : 1,
          }}
          contentFit="cover" // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={require("../../../assets/images/radios.png")} // opcional
          priority="high" // alta prioridad de carga
        />

        {/* <Image
						source={
							emisora.radioimg
								? { uri: emisora.radioimg, cache: "force-cache" }
								: require("../../../assets/images/radio-studio.jpg")
						}
						style={{
							width: "100%",
							height: 65,
							borderTopLeftRadius: 12,
							borderTopRightRadius: 12,
							opacity: isCurrentStation && isPlaying ? 0.25 : 1,
						}}
						contentFit="cover" // mejor que resizeMode
						transition={500} // fade suave al cargar
						placeholder={require("../../../assets/images/radios.png")} // opcional
						priority="high" // alta prioridad de carga
					/> */}

        {/* 🎧 Botón de play/pausa centrado */}
        {shouldShowButton && (
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: [{ translateX: -25 }, { translateY: -25 }],
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 999,
              padding: 1,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 5,
              zIndex: 10,
            }}
          >
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle-outline"}
              size={45}
              color="#ef4444"
            />
          </View>
        )}

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
            name={emisora.isFavorite ? "heart" : "heart-outline"}
            size={18}
            color="#ef4444"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Detalles de la emisora */}
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
      >
        <View className="p-1">
          <ThemedText
            numberOfLines={1}
            className="text-white font-Roboto-SemiBold  mb-1"
            // style={styles.titleText}
          >
            {emisora.radioname}
          </ThemedText>

          <ThemedText
            numberOfLines={2}
            // style={styles.titleText}
            className="text-xs leading-tight text-rose-500"
          >
            «Radio en vivo»
          </ThemedText>
        </View>

        {emisora.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-sm text-white pr-[2px]">
              {emisora.averageRating.toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={emisora.averageRating}
              commentsCount={emisora.commentsCount}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
