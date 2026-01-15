import { API_URL } from "@/core/api/radioPodcastApi";
import { useRegisterLatestView } from "@/core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView";
import { Episode } from "@/core/radio-podcast/interface/podcast/podcast-episodes.interface";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ShareButton } from "@/presentation/components/ShareButton";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { extractDirectAudioLink } from "@/utils/urlEpisodes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDownloadsStore } from "../store/useDownloadsStore";
import { EpisodeDownloadButton } from "./EpisodeDownloadButton";
import { getImageUrl } from "./PodcastGridItem";

interface Props {
  episodes: Episode[];
  isFetching: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  highlightedEpisodeId?: string | null;
  loadPreviousPage: () => void;
  loadNextPage: () => void;
}

export default function EpisodesList({
  episodes,
  hasNextPage,
  hasPreviousPage,
  isFetching,
  highlightedEpisodeId,
  loadNextPage,
  loadPreviousPage,
}: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { getDownloadedEpisode } = useDownloadsStore();

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const [activatedId, setActivatedId] = useState<string | null>(null);

  // const handlePlayClicks = (ep: Episode) => {
  // 	const stream = extractDirectAudioLink(ep.links);
  // 	if (!stream) {
  // 		console.warn("No se encontró un stream válido para este episodio");
  // 		return;
  // 	}

  // 	// Si el episodio actual ya se está reproduciendo → pausar / reanudar
  // 	if (streamUrl === stream) {
  // 		togglePlay();
  // 		setActivatedId(ep.id);
  // 		return;
  // 	}

  // 	const img = getImageUrl(ep.image);

  // 	// Si es otro episodio → configurar nuevo stream
  // 	setStream(
  // 		stream, // 🔹 streamUrl (.mp3)
  // 		ep.episodeTitle, // 🔹 título
  // 		img!, // 🔹 imagen
  // 		ep.podcast.slug, // 🔹 slug
  // 		ep.podcast.id, // 🔹 podcastId
  // 		"podcast", //!MODIFIQUEE
  // 	);

  // 	if (user && status === "authenticated" && streamUrl !== stream) {
  // 		try {
  // 			// Registrar la última vista
  // 			registerView({
  // 				type: "podcast",
  // 				podcastId: ep.podcast.id,
  // 			});
  // 		} catch (error) {
  // 			console.error("Error al registrar reproducción:", error);
  // 		}
  // 	}

  // 	setActivatedId(ep.id);
  // };
  const handlePlayClick = (ep: Episode) => {
    // 1️⃣ Buscar si el episodio ya fue descargado
    const downloaded = getDownloadedEpisode(ep.id);
    const localUri = downloaded?.uri;

    // 2️⃣ Si no está descargado, usar el enlace remoto
    const remoteStream = extractDirectAudioLink(ep.links);
    const stream = localUri || remoteStream;

    if (!stream) {
      console.warn("No se encontró un stream válido para este episodio");
      return;
    }

    // 3️⃣ Si ya se está reproduciendo este episodio → pausar / reanudar
    if (streamUrl === stream) {
      togglePlay();
      setActivatedId(ep.id);
      return;
    }

    const img = getImageUrl(ep.image);

    // Si es otro episodio → configurar nuevo stream
    setStream(
      stream, // 🔹 streamUrl (.mp3)
      ep.episodeTitle, // 🔹 título
      img!, // 🔹 imagen
      ep.podcast.slug, // 🔹 slug
      ep.podcast.id, // 🔹 podcastId
      ep.slug, // 👈 AQUÍ: Mandamos el slug del episodio al store
      // ep.isFavorite, // 👈 AQUÍ: Mandamos el slug del episodio al store
      // true, // 👈 AQUÍ: Mandamos el slug del episodio al store
      "podcast" //!MODIFIQUEE
    );

    if (user && status === "authenticated" && streamUrl !== stream) {
      try {
        // Registrar la última vista
        registerView({
          type: "podcast",
          podcastId: ep.podcast.id,
        });
      } catch (error) {
        console.error("Error al registrar reproducción:", error);
      }
    }

    setActivatedId(ep.id);
  };

  useEffect(() => {
    if (streamUrl === null) {
      setActivatedId(null);
    }
  }, [streamUrl]);

  // Animations
  const handleLoadNext = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start();
    await loadNextPage();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleLoadPrevious = async (event: any) => {
    event.stopPropagation();
    // 💡 Hacemos un pequeño fade-out para que no sea abrupto
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start();

    await new Promise((r) => setTimeout(r, 400)); // leve pausa para UX
    loadPreviousPage();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <ThemedView className="mt-4 px-4">
        <ThemedText className="text-lg font-semibold mb-3">
          🎙️ Episodios
        </ThemedText>

        {/* 1. Filtramos para eliminar duplicados por título antes de mapear */}
        {episodes
          .filter((ep, index, self) => {
            // Función para quitar tildes y dejar en minúsculas
            const normalize = (text: string) =>
              text
                ?.toLowerCase()
                .normalize("NFD") // Separa la letra de la tilde
                .replace(/[\u0300-\u036f]/g, "") // Elimina la tilde
                .trim();

            const currentTitle = normalize(ep.episodeTitle);

            return (
              index ===
              self.findIndex((t) => normalize(t.episodeTitle) === currentTitle)
            );
          })
          .map((ep) => {
            const stream = extractDirectAudioLink(ep.links);
            const isCurrent = streamUrl === stream;
            const isActive = activatedId === ep.id;
            const showAsPlaying = isCurrent && isPlaying;
            const destacado = ep.id === highlightedEpisodeId;

            // console.log({ ep }); // Solo para depuración

            return (
              <View
                key={ep.id}
                // className="bg-black/50 dark:bg-white/5 rounded-3xl mb-4 p-4 border border-white/10 shadow-sm">
                className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl mb-4 p-4"
                style={{
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                }}
              >
                <View className="flex-row">
                  {/* SECCIÓN IZQUIERDA: IMAGEN + SHARE */}
                  <View className="relative">
                    <Image
                      source={
                        ep.image
                          ? { uri: getImageUrl(ep.image), cache: "force-cache" }
                          : require("../../../assets/images/radio-podcast.jpg")
                      }
                      style={{
                        width: isTablet ? 120 : 90,
                        height: isTablet ? 120 : 90,
                        borderRadius: 20,
                      }}
                      className="bg-zinc-800"
                      placeholder={require("../../../assets/images/podcasts.png")}
                      transition={500} // fade suave al cargar
                      contentFit="cover"
                      priority="high" // alta prioridad de carga
                      // transition={500}
                    />
                    {/* Share posicionado de forma elegante sobre la imagen */}
                    <View className="absolute -top-1 -left-1 scale-90">
                      <ShareButton
                        title={`🎙️ ${ep.episodeTitle}`}
                        description={`Del podcast ${ep.episodeTitle}`}
                        url={`${API_URL}/podcastrd/${ep.podcast.slug}?episode=${ep.slug}`}
                      />
                    </View>
                  </View>

                  {/* SECCIÓN CENTRAL: INFO */}
                  <View className="flex-1 ml-4 justify-between">
                    <View>
                      <View className="flex-row items-center mb-1">
                        {destacado && (
                          <View className="bg-rose-500/20 px-2 py-0.5 rounded-md mr-2">
                            <ThemedText className="text-rose-500 text-[10px] font-black uppercase tracking-tighter">
                              Nuevo
                            </ThemedText>
                          </View>
                        )}
                        <ThemedText className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium">
                          {new Date(ep.episodeDate).toLocaleDateString(
                            "es-DO",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </ThemedText>
                      </View>

                      <ThemedText
                        className={`text-zinc-900 dark:text-zinc-50 font-bold leading-tight ${isTablet ? "text-xl" : "text-base"}`}
                        numberOfLines={2}
                      >
                        {ep.episodeTitle}
                      </ThemedText>
                    </View>

                    {/* Botón de Descarga integrado en la fila de info */}
                    <View className="flex-row items-center mt-2">
                      <EpisodeDownloadButton
                        urls={ep.links}
                        title={ep.episodeTitle}
                        episodeId={ep.id}
                        image={ep.image}
                        podcastTitle={ep.podcast.titleEncabezado}
                        description={ep.episodeDescription}
                      />
                    </View>
                  </View>

                  {/* SECCIÓN DERECHA: PLAY */}
                  <View className="justify-center pl-2">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handlePlayClick(ep)}
                      className={`items-center justify-center rounded-full ${
                        showAsPlaying || isActive
                          ? "bg-rose-500 shadow-lg shadow-rose-500/50"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                      style={{ width: 50, height: 50 }}
                    >
                      <Ionicons
                        name={
                          showAsPlaying ? "pause" : isActive ? "play" : "play"
                        }
                        // name={
                        //   showAsPlaying
                        //     ? "pause-circle"
                        //     : isActive
                        //       ? "play-circle"
                        //       : "play-circle-outline"
                        // }
                        size={28}
                        color={showAsPlaying || isActive ? "white" : "#ef4444"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* SECCIÓN INFERIOR: DESCRIPCIÓN */}
                <View className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                  {ep.episodeDescription ? (
                    <ThemedText
                      className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed"
                      numberOfLines={isTablet ? 3 : 2}
                    >
                      {ep.episodeDescription}
                    </ThemedText>
                  ) : (
                    <ThemedText
                      className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed"
                      numberOfLines={isTablet ? 3 : 2}
                    >
                      {`Episodios del podcast ${ep.episodeTitle} en ${ep.podcast.titleEncabezado} disfrutalo aquí gratis.`}
                    </ThemedText>
                  )}

                  <ThemedText
                    className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed"
                    numberOfLines={isTablet ? 3 : 2}
                  >
                    {ep.episodeDescription}
                  </ThemedText>
                </View>
              </View>
            );
          })}

        {/* 🔘 Botones de paginación */}
        <View className="flex-row justify-between px-5 py-4 border-t border-gray-800">
          {!isFetching && (
            <TouchableOpacity
              onPress={handleLoadPrevious}
              disabled={!hasPreviousPage || isFetching}
              className={`rounded-xl px-6 py-2 ${
                hasPreviousPage ? "bg-[#f43f5e]" : "bg-zinc-900/40"
              }`}
            >
              <ThemedText
                className={`text-sm ${
                  hasPreviousPage ? "text-white" : "text-gray-500"
                }`}
              >
                Cargar menos
              </ThemedText>
            </TouchableOpacity>
          )}

          {isFetching && (
            <View className="flex-col items-center justify-center text-center mx-auto">
              <ActivityIndicator color="#f43f5e" />
              <ThemedText className="animate-pulse">Episodios</ThemedText>
            </View>
          )}

          {!isFetching && (
            <TouchableOpacity
              onPress={handleLoadNext}
              disabled={!hasNextPage || isFetching}
              className={`rounded-xl px-6 py-2 ${
                hasNextPage ? "bg-[#f43f5e]" : "bg-zinc-900/40"
              }`}
            >
              <ThemedText
                className={`text-sm ${hasNextPage ? "text-white" : "text-gray-500"}`}
              >
                Cargar más
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </Animated.View>
  );
}
