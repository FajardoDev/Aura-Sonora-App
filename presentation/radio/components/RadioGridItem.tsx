import { mediaCardStyles, useMediaCardWidth } from "@/presentation/listening/media-card-layout";
import { RadioLogo } from "@/presentation/listening/HomeMediaCards";
import { useAuthNavigation } from "@/presentation/auth/hooks/useAuthNavigation";
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
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import { RatingStars } from "./RatingStars";
// import Animated from "react-native-reanimated";

export type RadioCardStation = Pick<Station, "id" | "slug" | "radioname" | "radioimg" | "stream"> &
  Partial<Pick<Station, "radioid" | "categories" | "locations" | "isFavorite" | "commentsCount" | "averageRating">> &
  { frecuencia?: string | number | null; country?: string };

interface Props {
  emisora: RadioCardStation;
  variant?: "grid" | "compact";
  showMetadata?: boolean;
  showLocationAndCategory?: boolean;
  index?: number;
  fullWidth?: boolean;
}

export default function RadioGridItem({
  emisora,
  index = 0,
  fullWidth,
  variant = "grid",
  showMetadata = variant !== "compact",
  showLocationAndCategory = showMetadata,
}: Props) {
  const { streamUrl, slug, type, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const cardWidth = useMediaCardWidth(variant);

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  const { requireAuth } = useAuthNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();
  // const { favorites, isLoading, toggleFavorite } = useFavoritesStore();
  // const isFavorites = favorites.some((f) => f.radioStationId === emisora.id);


  const isCurrentStation = type === "radio" && slug === emisora.slug && streamUrl === emisora.stream;

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
    if (isPending) return;
    if (!requireAuth()) return;
    const payload = {
      type: "radio" as EntityType,
      radioStationId: emisora.id,
      radioSlug: emisora.slug,
    };
    mutate(payload, {
      onError: () => Alert.alert(
        "No se pudo actualizar el favorito",
        "Comprueba tu conexión e inténtalo de nuevo."
      ),
    });
  };

  const handlePlayClick = () => {
    if (!emisora.stream) return;
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
        emisora.radioid || "",
        emisora.id,
        // emisora.isFavorite,
        "radio",
        { source: { kind: "radio", radioId: emisora.id, slug: emisora.slug, title: emisora.radioname,
          artwork: emisora.radioimg, stream: emisora.stream, radioid: emisora.radioid || "",
          categories: emisora.categories || [], locations: emisora.locations || [] } }
      );

      if (user && status === "authenticated" && slug !== emisora.slug) {
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
    }
  };

  const handlePress = () => {
    const targetPath = `/radio-station/${emisora.slug}`;

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

  // El estado activo procede únicamente del reproductor compartido.
  const shouldShowButton = isCurrentStation;

  const uri = emisora.radioimg;

  return (
    <View
      style={[mediaCardStyles.card, { width: fullWidth ? "auto" : cardWidth }]}
    >
      {/* Contenedor de imagen */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePlayClick}
        disabled={!emisora.stream}
        accessibilityRole="button"
        accessibilityLabel={isCurrentStation && isPlaying ? `Pausar ${emisora.radioname}` : `Escuchar ${emisora.radioname}`}
        accessibilityState={{ selected: isCurrentStation, disabled: !emisora.stream }}
        style={{ position: "relative" }}
      >
        <View style={{ opacity: isCurrentStation && isPlaying ? 0.25 : 1 }}>
          <RadioLogo uri={uri} />
        </View>

        {/* 🎧 Botón de play/pausa centrado */}
        {shouldShowButton && (
          <View
            pointerEvents="none"
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
              name={isCurrentStation && isPlaying ? "pause-circle" : "play-circle-outline"}
              size={45}
              color="#ef4444"
            />
          </View>
        )}

        {/* ❤️ Botón de favoritos arriba a la derecha */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleFavorites} // Llama a la función de toggle
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={isPending ? `Guardando favorito de ${emisora.radioname}`
            : `${emisora.isFavorite ? "Quitar" : "Agregar"} ${emisora.radioname} ${emisora.isFavorite ? "de" : "a"} favoritos`}
          accessibilityState={{ busy: isPending, disabled: isPending, selected: !!emisora.isFavorite }}
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
          {isPending ? <ActivityIndicator size={18} color="#ef4444" /> : <Ionicons
            name={emisora.isFavorite ? "heart" : "heart-outline"}
            size={18}
            color="#ef4444"
          />}
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
        accessibilityRole="button"
        accessibilityLabel={`Ver ${emisora.radioname}`}
        style={{
          minHeight: showMetadata && showLocationAndCategory ? undefined : 56,
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

          {showMetadata && emisora.frecuencia != null && !emisora.radioname.includes(String(emisora.frecuencia)) && (
            <ThemedText numberOfLines={1} className="text-zinc-400 text-[10px]">{emisora.frecuencia}</ThemedText>
          )}
          {showLocationAndCategory && !!(emisora.locations?.[0] || emisora.country || emisora.categories?.[0]) && (
            <ThemedText numberOfLines={1} className="text-zinc-400 text-[10px]">
              {[emisora.locations?.[0], emisora.country, emisora.categories?.[0]].filter(Boolean).join(" · ")}
            </ThemedText>
          )}
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

        {(emisora.commentsCount || 0) > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-[9px] text-white pr-[2px]">
              {(emisora.averageRating || 0).toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={emisora.averageRating || 0}
              commentsCount={emisora.commentsCount || 0}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
