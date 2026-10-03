import { formatTime } from "@/utils/formatTime";
import { mediaCardStyles, useMediaCardWidth } from "@/presentation/listening/media-card-layout";
import { useAuthNavigation } from "@/presentation/auth/hooks/useAuthNavigation";
import { API_URL } from "@/core/api/radioPodcastApi";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import {
  EntityType,
  Podcasts,
} from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { RatingStars } from "@/presentation/radio/components/RatingStars";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";

export type PodcastCardData = Pick<Podcasts, "id" | "slug" | "titleEncabezado" | "image"> &
  Partial<Pick<Podcasts, "titleSecond" | "isFavorite" | "commentsCount" | "averageRating">>;

interface Props {
  podcast: PodcastCardData;
  variant?: "grid" | "compact";
  index?: number;
  onPress?: () => void;
  continuation?: { podcastTitle: string; position: number; duration: number; onContinue: () => void };
  fullWidth?: boolean;
}

export const getImageUrl = (path?: string) => {
  // Si la ruta es nula o vacía, devolvemos undefined
  if (!path) return undefined;

  // 1. **COMPROBACIÓN CLAVE:** Si la ruta ya es una URL completa (absoluta), la devolvemos tal cual.
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // 2. Si no es una URL completa, construimos la URL base.
  //    Esto remueve "/api" y asegura que la base no termine en "/"
  const base = (API_URL ?? "").replace(/\/api\/?$/, "").replace(/\/$/, "");

  // 3. Aseguramos que la ruta comience con una sola barra "/"
  const safePath = path.startsWith("/") ? path : `/${path}`;

  // 4. Devolvemos la URL completa
  return `${base}${safePath}`;
};

export default function PodcastGridItem({ podcast, index, variant = "grid", onPress, continuation, fullWidth = false }: Props) {
  const cardWidth = useMediaCardWidth(variant);
  const { width: screenWidth } = useWindowDimensions();
  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();

  // Evitar multiples clic
  const { requireAuth } = useAuthNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // 2. Función para construir el payload y llamar a la mutación
  const handleToggleFavorite = () => {
    if (!requireAuth()) return;
    const payload = {
      type: "podcast" as EntityType,
      podcastId: podcast.id,
    };
    console.log(`[LOG] Iniciando mutación optimista para ID: ${podcast.id}`);
    mutate(payload);
  };

  const uri = getImageUrl(podcast.image);

  const handlesClic = () => {
    const targetPath = `/podcast/${podcast.slug}`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  const handlePress = () => {
    const targetPath = `/podcast/${podcast.slug}/#comments`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  if (continuation) {
    const progress = continuation.duration > 0
      ? Math.min(1, Math.max(0, continuation.position / continuation.duration)) : 0;
    return <TouchableOpacity activeOpacity={0.9} onPress={continuation.onContinue}
      accessibilityRole="button" accessibilityLabel={`Continuar ${podcast.titleEncabezado}, de ${continuation.podcastTitle}`}
      style={[mediaCardStyles.card, resumeStyles.card, { width: Math.min(screenWidth - 32, 400) }]}>
      <Image source={podcast.image ? { uri } : require("../../../assets/images/podcasts.png")}
        style={resumeStyles.artwork} contentFit="cover" transition={200} />
      <View style={resumeStyles.content}>
        <ThemedText numberOfLines={1} className="text-zinc-400 text-[10px] font-Roboto-SemiBold">{continuation.podcastTitle}</ThemedText>
        <ThemedText numberOfLines={2} className="text-white text-[13px] font-Roboto-ExtraBold mt-1">{podcast.titleEncabezado}</ThemedText>
        <View style={resumeStyles.footer}>
          <View style={resumeStyles.progressContent}>
            <View style={resumeStyles.track} accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
              <View style={[resumeStyles.progress, { width: `${progress * 100}%` }]} />
            </View>
            <ThemedText numberOfLines={1} className="text-zinc-400 text-[10px] mt-1">{continuation.duration > 0
              ? `${formatTime(Math.max(0, continuation.duration - continuation.position))} restantes`
              : `${formatTime(continuation.position)} escuchados`}</ThemedText>
          </View>
          <View style={resumeStyles.play}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>;
  }

  return (
    <View
      style={[mediaCardStyles.card, { width: fullWidth ? "auto" : cardWidth }]}
    >
      {/* Contenedor de imagen */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress || handlesClic}
        style={{ position: "relative" }}
      >
        <Image
          source={
            podcast.image
              ? { uri, cache: "force-cache" }
              : require("../../../assets/images/radio-studio.jpg")
          }
          style={mediaCardStyles.artwork}
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
      </TouchableOpacity>

      {/* Detalles de la podcast */}
      <TouchableOpacity
        onPress={onPress || handlePress}
        // onPress={() => router.push(`/podcast/${podcast.id}/#comments`)}
        style={{
          paddingTop: 5,
          paddingBottom: 5,
          backgroundColor: "#011016",
          // width: 125,
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
            {podcast.titleEncabezado}
          </ThemedText>
          {podcast.titleSecond && (
            <ThemedText
              numberOfLines={1}
              className="text-zinc-400 text-[9px] font-medium uppercase tracking-wide font-Roboto-SemiBold"
            >
              {podcast.titleSecond}
            </ThemedText>
          )}
        </View>

        {(podcast.commentsCount || 0) > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-[9px] text-zinc-400 pr-[2px]">
              {(podcast.averageRating || 0).toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={podcast.averageRating || 0}
              commentsCount={podcast.commentsCount || 0}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const resumeStyles = StyleSheet.create({
  card: { flexDirection: "row", padding: 10, alignItems: "center" },
  artwork: { width: 88, height: 88, borderRadius: 10 },
  content: { flex: 1, minWidth: 0, marginLeft: 12 },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  progressContent: { flex: 1, minWidth: 0 },
  track: { height: 4, borderRadius: 2, backgroundColor: "#475569", overflow: "hidden" },
  progress: { height: 4, backgroundColor: "#f43f5e", borderRadius: 2 },
  play: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f43f5e", marginLeft: 10,
    justifyContent: "center", alignItems: "center" },
});
