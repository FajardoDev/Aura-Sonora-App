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

        {episodes.map((ep) => {
          const stream = extractDirectAudioLink(ep.links);
          const isCurrent = streamUrl === stream;
          const isActive = activatedId === ep.id;
          const showAsPlaying = isCurrent && isPlaying;

          const destacado = ep.id === highlightedEpisodeId;

          // console.log(ep.image);p

          return (
            <View
              key={ep.id}
              className="bg-black/5 dark:bg-white/5 rounded-2xl mb-3 p-3 border border-white/10"
            >
              {/* Imagen + Info + Botón */}
              <ThemedView className="flex-row items-center justify-between rounded-md">
                {/* Imagen */}

                <Image
                  source={
                    ep.image
                      ? { uri: getImageUrl(ep.image), cache: "force-cache" }
                      : require("../../../assets/images/radio-podcast.jpg")
                  }
                  style={{
                    width: 75,
                    height: 75,
                    borderRadius: 15,
                    marginRight: 7,
                  }}
                  // className="w-20 h-20 rounded-xl mr-3"
                  contentFit="cover" // mejor que resizeMode
                  transition={500} // fade suave al cargar
                  placeholder={require("../../../assets/images/podcasts.png")}
                  priority="high" // alta prioridad de carga
                />

                <ShareButton
                  // className="absolute bg-black/70 rounded-full p-1 top-1 left-1 z-20"
                  title={`🎙️ ${ep.episodeTitle}`}
                  description={`Del podcast ${ep.episodeTitle}`}
                  url={`exp://192.168.100.58:8081/podcast/${ep.podcast.slug}?episode=${ep.slug}`}
                  // url={`exp://p0wl5ro-fajardodevs-8081.exp.direct/podcast/${ep.podcast.slug}?episode=${ep.slug}`}

                  // url={`${API_URL}/podcast/${ep.podcast.slug}/${ep.id}`}
                  // url={`https://tudominio.com/podcast/${ep.podcast.slug}/${ep.id}`}
                />

                {/* Info */}
                <View className="flex-1 mr-3">
                  {destacado && (
                    <ThemedText className="text-[#ff6b6b] font-bold">
                      Nuevo
                    </ThemedText>
                  )}
                  <ThemedText
                    className="text-base font-semibold"
                    numberOfLines={2}
                  >
                    {ep.episodeTitle}
                  </ThemedText>

                  <View className="flex-row justify-between items-center">
                    <View>
                      <ThemedText className="text-xs mt-1">
                        {new Date(ep.episodeDate).toLocaleDateString("es-DO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </ThemedText>
                    </View>

                    <View>
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

                  {/*                 
                  {ep.duration && (
                    <ThemedText className="text-xs mt-1">
                      {ep.duration}
                    </ThemedText>
                  )} */}

                  {/* <View className="absolute ml-28 mt-8"> */}
                  {/* <View className="absolute ml-34 mt-[42px]"> */}
                  {/* <View className="">
                    <EpisodeDownloadButton
                      urls={ep.links}
                      title={ep.episodeTitle}
                      episodeId={ep.id}
                      image={ep.image}
                      podcastTitle={ep.podcast.titleEncabezado}
                      description={ep.episodeDescription}
                    />
                  </View> */}
                </View>

                {/* Botón reproducir */}
                <TouchableOpacity
                  className="bg-black/5 dark:bg-white p-2 rounded-full"
                  onPress={() => handlePlayClick(ep)}
                >
                  <Ionicons
                    name={
                      showAsPlaying
                        ? "pause-circle"
                        : isActive
                          ? "play-circle"
                          : "play-circle-outline"
                    }
                    size={38}
                    color="#ef4444"
                  />
                </TouchableOpacity>
              </ThemedView>

              {/* Descripción */}
              <ThemedText className="text-sm mt-3 leading-5" numberOfLines={4}>
                {ep.episodeDescription}
              </ThemedText>
            </View>
          );
        })}

        {/* {episodes.map((ep) => (
					<EpisodeItem
						key={ep.id}
						ep={ep}
						onPlay={handlePlayClick} // tu handler ya existente
						isPlayingGlobalStreamUrl={streamUrl}
					/>
				))} */}

        {/* Indicador de carga mientras busca más episodios */}
        {/* {isFetching && (
					<View className="items-center mt-4">
						<ActivityIndicator color="#ef4444" />
						<Text className="text-gray-400 mt-2 text-sm">
							Cargando episodios...
						</Text>
					</View>
				)} */}

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

/*






















	 Botones de paginación 
				{/* <View className="flex-row justify-between mt-6">
				{hasPreviousPage ? (
					<TouchableOpacity
						onPress={() => loadPreviousPage()}
						className="flex-1 bg-white/10 py-3 rounded-xl mr-2 border border-white/20"
					>
						<Text className="text-center text-white font-semibold">
							⬅️ Cargar menos
						</Text>
					</TouchableOpacity>
				) : (
					<View className="flex-1 mr-2" />
				)}

				{hasNextPage ? (
					<TouchableOpacity
						onPress={() => loadNextPage()}
						className="flex-1 bg-rose-600 py-3 rounded-xl"
					>
						<Text className="text-center text-white font-semibold">
							Cargar más ➡️
						</Text>
					</TouchableOpacity>
				) : (
					<View className="flex-1" />
				)}
			</View> 

				{/* <View className="mt-4">
				<Button title="Cargar más episodios" color="#ef4444" />
			</View> 




				// return (
	// 	<View className="mt-4 px-4">
	// 		<Text className="text-white text-lg font-semibold mb-3">🎙️ Episodios</Text>

	// 		{episodes.map((ep) => {
	// 			return (
	// 				<View
	// 					key={ep.id}
	// 					className="bg-white/5 rounded-2xl mb-3 p-3 border border-white/10"
	// 				>
	// 					 Contenedor principal: imagen + info + botón 
	// 					<View className="flex-row items-center justify-between">
	// 						{/* Imagen 
	// 						<Image
	// 							source={
	// 								ep.image
	// 									? { uri: getImageUrl(ep.image) }
	// 									: require("../../../assets/images/radio-podcast.jpg")
	// 							}
	// 							className="w-20 h-20 rounded-xl mr-3"
	// 							resizeMode="cover"
	// 						/>

	// 						{/* Info del episodio 
	// 						<View className="flex-1 mr-3">
	// 							<Text
	// 								className="text-white text-base font-semibold"
	// 								numberOfLines={1}
	// 							>
	// 								{ep.episodeTitle}
	// 							</Text>

	// 							<Text className="text-gray-400 text-xs mt-1">
	// 								{new Date(ep.episodeDate).toLocaleDateString("es-DO", {
	// 									year: "numeric",
	// 									month: "long",
	// 									day: "numeric",
	// 								})}
	// 							</Text>
	// 						</View>

	// 						{/* Botón de reproducir 
	// 						<TouchableOpacity
	// 							className="bg-white p-1 rounded-full ml-2 "
	// 							onPress={handlePlayClick as any}
	// 						>
	// 							<Ionicons
	// 								name={isPlaying ? "pause-circle" : "play-circle-outline"}
	// 								size={35}
	// 								color="#ef4444"
	// 							/>
	// 						</TouchableOpacity>
	// 					</View>

	// 					{/* Descripción
	// 					<Text
	// 						className="text-gray-300 text-sm mt-3 leading-5"
	// 						numberOfLines={4}
	// 					>
	// 						{ep.episodeDescription}
	// 					</Text>
	// 				</View>
	// 			);
	// 		})}

	// 		<View className="mt-4">
	// 			<Button title="Cargar más episodios" color="#ef4444" />
	// 		</View>
	// 	</View>
	// );




* */
