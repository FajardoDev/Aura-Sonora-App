import { API_URL } from "@/core/api/radioPodcastApi";
import { FlatHistoryEntityPage } from "@/core/radio-podcast/actions/radio-podcast/hooks/useHistorys";
import { useRegisterLatestView } from "@/core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { FavoriteTogglePayload } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../auth/store/useAuthStore";
import { ShareButton } from "../components/ShareButton";
import { getImageUrl } from "../podcast/components/PodcastGridItem";
import { RatingStars } from "../radio/components/RatingStars";
import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";
import ThemedText from "../theme/components/themed-text";

interface HistoryGridItemProps {
  item: FlatHistoryEntityPage;
  queryKey: string[];
}

export default function HistoryGridItem({
  item,
  queryKey,
}: HistoryGridItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const { mutate, isPending } = useToggleFavorite();

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  const [activated, setActivated] = useState(false); // Para el efecto visual de "recién clickeado"

  const isRadio = item.type === "radio";
  const title = isRadio ? item.radioname : item.titleEncabezado;
  const imageUrl = isRadio ? item.image : getImageUrl(item.image); // Asumiendo que item.image es la URL final
  const entitySlug = item.slug; // Usamos slug genérico para navegación
  const entityStream = isRadio ? item.stream : undefined; // Usamos audioUrl para podcasts
  const id = item.entityId;
  const isCurrentPlaying = streamUrl === entityStream;

  // Efecto para resetear el estado 'activated' si la estación actual cambia
  useEffect(() => {
    if (!isCurrentPlaying && activated) {
      setActivated(false);
    }
  }, [isCurrentPlaying, activated]);

  const handleToggleFavorite = () => {
    // if (isPending) return;

    const payload: FavoriteTogglePayload = {
      type: item.type,
      // radioStationId: isRadio ? id : undefined,
      // podcastId: !isRadio ? id : undefined,
      radioSlug: isRadio ? entitySlug : undefined,
      podcastSlug: !isRadio ? entitySlug : undefined,
    };

    console.log({ payload });
    mutate(payload);
  };

  const handlePlayClick = () => {
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      setStream(
        entityStream!,
        title!,
        imageUrl!,
        entitySlug,
        item.entityId,
        id,
        item.type
      );

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

  const shouldShowButton = isCurrentPlaying || activated;

  return (
    <View
      style={{
        width: "30%", // Ajuste para 3 columnas
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
      {/* Contenedor de imagen y botones de control */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleClic}
        style={{ position: "relative" }}
      >
        {/* Imagen de la entidad (Radio/Podcast) */}

        <Image
          source={
            item.image
              ? { uri: imageUrl, cache: "force-cache" }
              : require("../../assets/images/radio-studio.jpg")
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
          contentFit={`${isRadio ? "cover" : "cover"}`} // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={require("../../assets/images/radio-podcast.jpg")} // opcional
          priority="high" // alta prioridad de carga
        />

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
          {/* <Ionicons name={"heart"} size={18} color="#ef4444" /> */}
          <Ionicons
            name={item.isFavorite ? "heart" : "heart-outline"}
            size={18}
            color="#ef4444"
          />
        </TouchableOpacity>

        {item.type === "radio" && (
          <ShareButton
            className="absolute bg-[rgba(0,0,0,0.7)] rounded-full p-1 top-1 left-1 z-20"
            title={`Escucha ${item.radioname}`}
            description="Sintoniza tu emisora favorita en vivo."
            url={`${API_URL}/radio-station/${item.slug}`}
          />
        )}
      </TouchableOpacity>

      {/* Detalles de la entidad */}
      <TouchableOpacity
        onPress={handleDetailsClick}
        style={styles.detailsContainer}
      >
        <View className="p-1">
          <ThemedText
            numberOfLines={1}
            className="text-white font-Roboto-ExtraBold mb-1 text-[13px]"
          >
            {title}
          </ThemedText>

          {/* Contenedor de Subtítulo / Estado En Vivo */}
          <View className="flex-row items-center">
            {isRadio ? (
              // ESTADO EN VIVO PARA RADIOS
              <View className="flex-row items-center mr-1">
                {/* El punto rojo ahora está alineado perfectamente */}
                <View className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-1.5 shadow-sm shadow-rose-500" />
                <ThemedText
                  numberOfLines={1}
                  className="text-rose-500 text-[10px] font-bold  tracking-wider font-Roboto-SemiBold"
                >
                  En Vivo
                </ThemedText>
              </View>
            ) : (
              // SUBTÍTULO PARA PODCASTS (Solo si existe)
              item.subtitle && (
                <ThemedText
                  numberOfLines={1}
                  className="text-zinc-400 text-[9px] font-medium uppercase tracking-wide font-Roboto-SemiBold"
                >
                  {item.subtitle}
                </ThemedText>
              )
            )}
          </View>
        </View>

        {item.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-[9px] text-white pr-[2px]">
              {item.averageRating.toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={item.averageRating}
              commentsCount={item.commentsCount}
            />
          </View>
        )}
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
    paddingTop: 3,
    paddingBottom: 4,
    // backgroundColor: "#0c0c0cdf",
    backgroundColor: "#011016",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  titleText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#1e293b",
    paddingBottom: 3,
  },
});
