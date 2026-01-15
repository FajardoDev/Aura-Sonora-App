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
import { TouchableOpacity, View } from "react-native";

interface Props {
  podcast: Podcasts;
  index?: number;
  // fullWidth?: boolean;
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

export default function PodcastGridItem({ podcast, index }: Props) {
  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();

  // Evitar multiples clic
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // 2. Función para construir el payload y llamar a la mutación
  const handleToggleFavorite = () => {
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
        onPress={handlesClic}
        style={{ position: "relative" }}
      >
        <Image
          source={
            podcast.image
              ? { uri, cache: "force-cache" }
              : require("../../../assets/images/radio-studio.jpg")
          }
          style={{
            width: "100%",
            height: 120,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            // width: "100%",
            // height: 65,
            // borderTopLeftRadius: 12,
            // borderTopRightRadius: 12,
            // objectFit: "cover",
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
        onPress={handlePress}
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

        {podcast.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-[9px] text-zinc-400 pr-[2px]">
              {podcast.averageRating.toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={podcast.averageRating}
              commentsCount={podcast.commentsCount}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
