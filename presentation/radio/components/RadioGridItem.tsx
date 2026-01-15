import { API_URL } from "@/core/api/radioPodcastApi";
import { useRegisterLatestView } from "@/core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import {
  EntityType,
  Station,
} from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ShareButton } from "@/presentation/components/ShareButton";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import { RatingStars } from "./RatingStars";
// import Animated from "react-native-reanimated";

interface Props {
  emisora: Station;
  index?: number;
  fullWidth?: boolean;
}

export default function RadioGridItem({
  emisora,
  index = 0,
  fullWidth,
}: Props) {
  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();
  // const { favorites, isLoading, toggleFavorite } = useFavoritesStore();
  // const isFavorites = favorites.some((f) => f.radioStationId === emisora.id);

  const [activated, setActivated] = useState(false); // 🔹 estado local por card

  const isCurrentStation = streamUrl === emisora.stream;

  // 💡 PASO DE DEBUGGING: Monitorear cuándo cambia la prop 'emisora'
  // useEffect(() => {
  // 	// Si el estado es true, el log debe aparecer INSTANTÁNEAMENTE al hacer clic.
  // 	if (emisora.isFavorite) {
  // 		console.log(
  // 			`[DEBUG - ITEM ${index}] Emisora ${emisora.radioname} es ahora FAVORITA. ¡INSTANTÁNEO!`,
  // 		);
  // 	} else {
  // 		console.log(
  // 			`[DEBUG - ITEM ${index}] Emisora ${emisora.radioname} es NO FAVORITA.`,
  // 		);
  // 	}
  // }, [emisora.isFavorite, index, emisora.radioname]);
  // // Nota: El useEffect solo se dispara cuando isFavorite cambia.

  // 2. Función para construir el payload y llamar a la mutación

  //!🎈
  // useEffect(() => {
  // 	const checkStatus = async () => {
  // 		// Si ya lo tienes en store, no consultes al backend
  // 		const isFavLocal = favorites.some((f) => f.radioStationId === emisora.id);
  // 		if (isFavLocal) return setIsFavorite(true);

  // 		// Caso contrario, verifica en backend
  // 		const { isFavorite } = await getFavoriteStatus({
  // 			type: "radio",
  // 			radioStationId: emisora.id,
  // 		});

  // 		setIsFavorite(isFavorite);
  // 	};

  // 	checkStatus();
  // }, [emisora.id]);

  // const handleToggleFavorite = async () => {
  // 	if (!emisora || isLoading) return;

  // 	const payload = {
  // 		type: "radio" as EntityType,
  // 		radioStationId: emisora.id,
  // 		radioSlug: emisora.slug,
  // 	};

  // 	console.log(payload);

  // 	await toggleFavorite(payload); // ← se maneja en la store (Zustand)
  // };

  // 🧠 Cargar estado del favorito

  //🎈
  const handleToggleFavorites = () => {
    const payload = {
      type: "radio" as EntityType,
      radioStationId: emisora.id,
      radioSlug: emisora.slug,
    };
    console.log(`[LOG] Iniciando mutación optimista para ID: ${emisora.id}`);
    mutate(payload);
  };

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
        "radio" //!MODIFIQUEE
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

  // ✅ 2. Toggle seguro con bloqueo para evitar duplicados
  // const handleToggleFavorite = async () => {
  // 	if (isLoading) return; // Evita spam de clics

  // 	const payload = {
  // 		type: "radio" as EntityType,
  // 		radioStationId: emisora.id,
  // 		radioSlug: emisora.slug,
  // 	};

  // 	await toggleFavorite(payload);
  // };

  // Condición para mostrar el icono flotante: Si es la estación actual O si acaba de ser clickeada
  const shouldShowButton = isCurrentStation || activated;

  const uri = emisora.radioimg;

  return (
    <View
      style={{
        width: "30%",
        margin: 5,
        // backgroundColor: "#fff",
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
        <Image
          source={
            emisora.radioimg
              ? { uri, cache: "force-cache" }
              : require("../../../assets/images/radio-studio.jpg")
          }
          // className="h-20 w-20 rounded-full object-cover mb-2"
          style={{
            width: "100%",
            height: 70,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            // borderBottomRightRadius: 10,
            // borderBottomLeftRadius: 10,
            opacity: isCurrentStation && isPlaying ? 0.25 : 1,
          }}
          contentFit="cover" // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={require("../../../assets/images/radios.png")} // opcional
          priority="high" // alta prioridad de carga
        />

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
          onPress={handleToggleFavorites} // Llama a la función de toggle
          disabled={isPending} // Deshabilitar mientras la mutación está en curso (opcional)
          style={{
            position: "absolute",
            top: 0,
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

        {/* Compartir */}
        <ShareButton
          // className="absolute bg-black/70 rounded-full p-1 top-1 left-1 z-20"
          title={`Escucha ${emisora.radioname}`}
          description="Sintoniza tu emisora favorita en vivo."
          url={`${API_URL}/radio-station/${emisora.slug}`}
        />
      </TouchableOpacity>

      {/* Detalles de la emisora */}
      <TouchableOpacity
        onPress={handlePress}
        style={{
          paddingTop: 2,
          paddingBottom: 3,
          backgroundColor: "#011016",
          // width: 150,
          // backgroundColor: "#f9fafb",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      >
        <View className="p-1">
          <ThemedText
            numberOfLines={1}
            className="text-white font-Roboto-ExtraBold mb-1 text-[13px]"
          >
            {emisora.radioname}
          </ThemedText>

          <View className="flex-row items-center mr-1">
            <View className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5 shadow-sm shadow-rose-500" />

            <ThemedText
              numberOfLines={1}
              // style={styles.titleText}
              className="text-rose-500 text-[10px] font-bold  tracking-wider font-Roboto-SemiBold"
            >
              En vivo
            </ThemedText>
          </View>
        </View>

        {emisora.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-[9px] text-white pr-[2px]">
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
