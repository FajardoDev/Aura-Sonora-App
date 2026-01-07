import { useRegisterLatestView } from "@/core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import {
  FavoriteTogglePayload,
  FlatFavoriteEntity,
} from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ShareButton } from "@/presentation/components/ShareButton";
import { getImageUrl } from "@/presentation/podcast/components/PodcastGridItem";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  // Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import { RatingStars } from "./RatingStars";

/**
 * Interface de propiedades para el componente de ítem de favorito.
 * @prop {FlatFavoriteEntity} item - La entidad unificada (Radio o Podcast) favorita.
 * @prop {string[]} queryKey - La clave de la consulta de TanStack Query a invalidar (clave de useFetchFavorites).
 */
interface FavoriteGridItemProps {
  item: FlatFavoriteEntity;
  queryKey: string[];
  // onToggleFavorite?: (id: string, isFav: boolean) => void; // ✅ callback
  // onRemove: () => void;
}

/**
 * Componente de grilla para elementos favoritos (Radios o Podcasts).
 * Enfocado en la Lógica de ELIMINACIÓN de favorito y reproducción.
 */
// const _FavoriteGridItem: React.FC<FavoriteGridItemProps> = ({
export default function FavoriteGridItem({
  item,
  queryKey,
}: FavoriteGridItemProps) {
  // Hooks principales
  // Evitar multiples clic
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const { mutate, isPending } = useToggleFavorite();

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  // Estados locales
  const [activated, setActivated] = useState(false); // Para el efecto visual de "recién clickeado"

  // useEffect(() => {
  // 	fetchFavorites("radio");
  // }, []);

  // Data unificada y condicional (uso de item.radioname y item.stream simplificado por el FlatFavoriteEntity)

  const isRadio = item.type === "radio";
  const title = isRadio ? item.radioname : item.titleEncabezado;
  const titleSecond = isRadio ? "Radio en vivo" : item.titleSecond;
  const imageUrl = isRadio ? item.radioimg : getImageUrl(item.image); // Asumiendo que item.image es la URL final
  const entitySlug = item.slug; // Usamos slug genérico para navegación
  const entityStream = isRadio ? item.stream : item.audioUrl; // Usamos audioUrl para podcasts
  const id = item.id;
  const isCurrentPlaying = streamUrl === entityStream;

  // Efecto para resetear el estado 'activated' si la estación actual cambia
  useEffect(() => {
    if (!isCurrentPlaying && activated) {
      setActivated(false);
    }
  }, [isCurrentPlaying, activated]);

  const handleToggleFavorite = () => {
    if (isPending) return;

    const payload: FavoriteTogglePayload = {
      type: item.type,
      radioStationId: isRadio ? id : undefined,
      podcastId: !isRadio ? id : undefined,
    };

    // Despues (Solución INSTANTÁNEA):
    mutate(payload, {
      onSuccess: () => {
        // La actualización de la lista es ahora optimista e INSTANTÁNEA.
        // El hook se encarga del refetch de confirmación en background.
        Alert.alert("Éxito", "Favorito eliminado.");
      },
      onError: (error: any) => {
        Alert.alert("Error", "No se pudo eliminar el favorito.");
        console.error("Error al eliminar favorito:", error);
      },
    });
  };

  // Lógica de Reproducción
  const handlePlayClick = () => {
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      setStream(
        entityStream,
        title,
        imageUrl!,
        entitySlug,
        item.radioid,
        id,
        item.type
      ); //!MODIFIQUEE

      if (user && status === "authenticated" && streamUrl !== entityStream) {
        try {
          // Registrar la última vista
          registerView({
            type: item.type,
            radioStationId: id,
            // podcastId: id,
          });
        } catch (error) {
          console.error("Error al registrar reproducción:", error);
        }
      }

      setActivated(true);
    }
  };

  // Lógica de Navegación
  // const handleDetailsClicks = () => {
  // 	const route = isRadio
  // 		? `/radio-station/${entitySlug}/#comments`
  // 		: `/podcast/${entitySlug}/#comments`;
  // 	router.push(route as any);
  // };

  // Lógica de Navegación anti doble clic
  const handleDetailsClick = () => {
    const targetPath = isRadio
      ? `/radio-station/${entitySlug}/#comments`
      : `/podcast/${entitySlug}/#comments`;
    if (isNavigating || pathname === targetPath) return; // Evita volver a cargar la misma ruta
    setIsNavigating(true);

    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const handleClic = () => {
    if (item.type === "radio") {
      handlePlayClick();
    } else {
      const targetPath = `/podcast/${item.slug}`;

      // Evita volver a cargar la misma ruta o tocar varias veces
      if (isNavigating || pathname === targetPath) return;

      setIsNavigating(true);
      router.push(targetPath as any);

      // Bloquea clics por 1 segundo
      setTimeout(() => setIsNavigating(false), 1000);
    }
  };

  // Condición para mostrar el icono flotante de play/pause
  const shouldShowButton = isCurrentPlaying || activated;

  // --- Renderizado ---

  return (
    <View
      style={{
        width: "30%", // Ajuste para 3 columnas
        margin: 5,
        backgroundColor: "#011016",
        borderRadius: 12,
        boxShadow: "2px 2px 5px #011016",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Contenedor de imagen y botones de control */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleClic}
        // onPress={handlePlayClick}
        style={{ position: "relative" }}
      >
        {/* Imagen de la entidad (Radio/Podcast) */}
        <Image
          source={
            imageUrl
              ? { uri: imageUrl, cache: "force-cache" }
              : require("../../../assets/images/radio-studio.jpg")
          }
          style={{
            width: "100%",
            height: isRadio ? 70 : 110,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            opacity: isCurrentPlaying && isPlaying ? 0.25 : 1,
          }}
          contentFit="cover" // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={require("../../../assets/images/radio-podcast.jpg")} // opcional
          priority="high" // alta prioridad de carga
        />

        {/* <Image
					className="shadow-lg shadow-black"
					source={
						imageUrl
							? { uri: imageUrl }
							: require("../../../assets/images/radio-studio.jpg") // Placeholder
					}
					style={{
						width: "100%",
						height: 65,
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,
						resizeMode: "cover",
						opacity: isCurrentPlaying && isPlaying ? 0.25 : 1,
					}}
				/> */}

        {/* 🎧 Botón de play/pausa centrado */}
        {shouldShowButton && item.type === "radio" && (
          <View style={styles.playButtonContainer}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle-outline"}
              size={45}
              color="#ef4444"
            />
          </View>
        )}

        {/* ❤️ Botón de ELIMINACIÓN de favorito (Corazón Lleno Fijo) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleFavorite}
          disabled={isPending}
          style={styles.favoriteButton}
        >
          <Ionicons name={"heart"} size={18} color="#ef4444" />
        </TouchableOpacity>

        {item.type === "radio" && (
          <ShareButton
            className="absolute bg-[rgba(0,0,0,0.7)] rounded-full p-1 top-1 left-1 z-20"
            title={`Escucha ${item.radioname}`}
            description="Sintoniza tu emisora favorita en vivo."
            url={`exp://192.168.100.58:8081/radio-station/${item.slug}`}
            // url={`https://tudominio.com/radio-station/${emisora.slug}`}
          />
        )}
      </TouchableOpacity>

      {/* Detalles de la entidad */}
      <TouchableOpacity
        onPress={handleDetailsClick}
        style={styles.detailsContainer}
      >
        {/* <ThemedText numberOfLines={1} style={styles.titleText}>
          {title}
        </ThemedText> */}

        <View className="p-1">
          <ThemedText
            numberOfLines={1}
            className="text-white font-Roboto-SemiBold mb-1"
            // style={styles.titleText}
          >
            {title}
          </ThemedText>
          {titleSecond && (
            <ThemedText
              numberOfLines={2}
              // style={styles.titleText}
              className="text-white text-xs leading-tight"
            >
              {titleSecond}
            </ThemedText>
          )}
        </View>

        {item.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-sm text-white pr-[2px]">
              {item.averageRating.toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={item.averageRating}
              commentsCount={item.commentsCount}
            />
          </View>
        )}

        {/* <View className="flex-row mx-[2px] items-center justify-center">
          <ThemedText className="text-sm text-white pr-[2px]">
            {item.averageRating.toFixed(1)}
          </ThemedText>
          <RatingStars
            rating={item.averageRating}
            commentsCount={item.commentsCount}
          />
        </View> */}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  playButtonContainer: {
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
  },
  favoriteButton: {
    position: "absolute",
    top: 2,
    right: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 999,
    padding: 6,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    paddingTop: 5,
    paddingBottom: 5,
    width: 125,
    backgroundColor: "#0c0c0cdf",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  titleText: {
    textAlign: "center",
    fontWeight: "600",
    color: "white",
    paddingBottom: 3,
  },
});

// 💡 Exportamos el componente memoizado para performance
// export const FavoriteGridItem = React.memo(_FavoriteGridItem);
