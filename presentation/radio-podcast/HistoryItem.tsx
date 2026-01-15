import { API_URL } from "@/core/api/radioPodcastApi";
import { FlatHistoryEntity } from "@/core/radio-podcast/actions/radio-podcast/hooks/useHistory";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { FavoriteTogglePayload } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ShareButton } from "../components/ShareButton";
import { getImageUrl } from "../podcast/components/PodcastGridItem";
import { RatingStars } from "../radio/components/RatingStars";
import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";
import ThemedText from "../theme/components/themed-text";

//   {renderList(radios, 'Radios Recientes 📻')}

{
  /* 2. Lista de Podcasts 
    {renderList(podcasts, 'Podcasts Recientes 🎙️')}
    */
}

// interface Props {
// 	item: PodcastElement;
// }

// interface HistoryItemProps {
// 	item: any;
// 	type: "radio" | "podcast";
// }

interface HistoryItemProps {
  item: FlatHistoryEntity;
}

export default function HistoryItem({ item }: HistoryItemProps) {
  // Evitar multiples clic
  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();

  const { mutate, isPending } = useToggleFavorite();

  const [activated, setActivated] = useState(false);

  const isRadio = item.type === "radio";
  const title = isRadio ? item.radioname : item.titleEncabezado;
  const imageUrl = isRadio ? item.image : getImageUrl(item.image); // Asumiendo que item.image es la URL final
  const entitySlug = item.slug; // Usamos slug genérico para navegación
  const entityStream = isRadio ? item.stream : undefined; // Usamos audioUrl para podcasts
  const id = item.id;
  const isCurrentPlaying = streamUrl === entityStream;

  // useEffect(() => {
  // 	if (!isCurrentPlaying && activated) {
  // 		setActivated(false);
  // 	}
  // }, [isCurrentPlaying, activated]);

  const handleToggleFavorite = () => {
    // if (isPending) return;

    const payload: FavoriteTogglePayload = {
      type: item.type,
      radioSlug: isRadio ? entitySlug : undefined,
      podcastSlug: !isRadio ? entitySlug : undefined,
    };

    console.log({ payload });
    mutate(payload);
  };
  // const handleToggleFavorite = () => {
  // 	// if (isPending) return;

  // 	const isRadio = item.type === "radio";

  // 	// Construimos el payload dinámicamente
  // 	const payload = isRadio
  // 		? {
  // 				type: "radio" as const,
  // 				radioStationId: item.id,
  // 				radioSlug: item.slug,
  // 			}
  // 		: {
  // 				type: "podcast" as const,
  // 				podcastId: item.id,
  // 				podcastSlug: item.slug,
  // 			};

  // 	console.log(
  // 		`[LOG] Iniciando toggle favorito para ${item.type.toUpperCase()} ID: ${item.slug}`,
  // 	);
  // 	mutate(payload);
  // };
  const isFavorites = item.isFavorite;

  // Lógica de Reproducción
  const handlePlayClick = () => {
    if (isCurrentPlaying) {
      togglePlay();
    } else {
      setStream(
        entityStream!,
        title!,
        imageUrl!,
        entitySlug,
        id,
        item.slug,
        // isFavorites,
        item.type
      );

      // setActivated(true);
    }
  };

  // console.log({ title, isFavorites });

  // const handlePress = () => {
  // 	if (item.type === "radio") {
  // 		router.push(`/radio-station/${item.slug}`);
  // 	} else {
  // 		router.push(`/podcast/${item.slug}`);
  // 	}
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

  // const shouldShowButton = isCurrentPlaying || activated;

  // Mostrar botón solo si está activa esta estación
  const shouldShowButton = isCurrentPlaying;

  return (
    <View
      style={{
        // width: "30%", // Ajuste para 3 columnas
        margin: 5,
        // backgroundColor: "#fff",
        backgroundColor: "#011016",
        borderRadius: 12,
        boxShadow: "2px 2px 5px #011016",
        // boxShadow: "5px 5px 1px #042735",
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
        style={{ position: "relative" }}
      >
        <Image
          source={
            item.image
              ? { uri: imageUrl, cache: "force-cache" }
              : require("../../assets/images/radio-podcast.jpg")
          }
          style={{
            width: "100%",
            height: isRadio ? 70 : 120,
            // height: isRadio ? 70 : 110,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            opacity: isCurrentPlaying && isPlaying ? 0.25 : 1,
          }}
          contentFit="cover" // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={
            item.type === "podcast"
              ? require("../../assets/images/podcasts.png")
              : require("../../assets/images/radios.png")
          } // opcional
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
            // style={styles.titleText}
          >
            {item.title}
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

  // return (
  // 	<TouchableOpacity
  // 		onPress={handlePress}
  // 		activeOpacity={0.8}
  // 		className="mr-4 w-40 rounded-2xl overflow-hidden bg-zinc-900"
  // 	>
  // 		<View className="relative h-44 w-full">
  // 			<Image
  // 				source={{ uri: item.image }}
  // 				className="w-full h-full"
  // 				resizeMode="cover"
  // 			/>
  // 			<LinearGradient
  // 				colors={["#00000080", "#00000000"]}
  // 				start={{ x: 0, y: 1 }}
  // 				end={{ x: 0, y: 0 }}
  // 				className="absolute bottom-0 left-0 right-0 h-20"
  // 			/>
  // 		</View>

  // 		<View className="p-2">
  // 			<Text numberOfLines={1} className="text-white font-semibold text-sm mb-1">
  // 				{item.title}
  // 			</Text>
  // 			{item.subtitle && (
  // 				<Text numberOfLines={2} className="text-gray-400 text-xs leading-tight">
  // 					{item.subtitle}
  // 				</Text>
  // 			)}
  // 		</View>
  // 	</TouchableOpacity>
  // );
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
    paddingTop: 2,
    paddingBottom: 3,
    backgroundColor: "#011016",
    // backgroundColor: "#0c0c0cdf",
    width: 125,
    // height: 70,
    // backgroundColor: "#3d011f11",
    // backgroundColor: "#f9fafb",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    // borderRadius: 12,
  },
  titleText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#1e293b",
    paddingBottom: 3,
  },
});
