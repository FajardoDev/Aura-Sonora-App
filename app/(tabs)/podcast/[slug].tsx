/* eslint-disable react-hooks/exhaustive-deps */
import { Episode } from "@/core/radio-podcast/interface/podcast/podcast-episodes.interface";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import EpisodesList from "@/presentation/podcast/components/EpisodesList";
import PodcastHeader from "@/presentation/podcast/components/PodcastHeader";
import RelatedPodcasts from "@/presentation/podcast/components/RelatedPodcasts";
import { usePodcastById } from "@/presentation/podcast/hooks/usePodcastById";
import { usePodcastEpisodes } from "@/presentation/podcast/hooks/usePodcastEpisodes";
import Comentarios from "@/presentation/radio/components/Comentarios";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { filterUniqueEpisodes } from "@/utils/filterUniqueEpisodes";
import NetInfo from "@react-native-community/netinfo";
import {
  Redirect,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  View,
} from "react-native";

export default function PodcastDetail() {
  const { slug, episode } = useLocalSearchParams<{
    slug: string;
    episode?: string;
  }>();
  const prevSlugRef = useRef(slug);

  const scrollViewRef = useRef<ScrollView>(null);

  const { isConnected } = useNetworkStatus();
  const { streamUrl } = useAudioPlayerStore();

  // const isTransitioning = useRef(false);

  // local
  const [activated, setActivated] = useState(false);

  // data fetch
  const { podcastByIdQuery } = usePodcastById(`${slug}`);

  // stable radio data reference
  const podcastData = podcastByIdQuery.data ?? undefined;

  // PodcastID
  const podcastId = podcastData?.podcast?.id ?? "";

  // Episodes
  const {
    podcastEpisodesQuery,
    hasNextPage,
    isFetching,
    loadNextPage,
    hasPreviousPage,
    loadPreviousPage,
  } = usePodcastEpisodes(podcastId); // Epidodios dentro de detalles del podcast

  useFocusEffect(
    useCallback(() => {
      podcastByIdQuery.refetch();
      return () => {};
    }, [podcastByIdQuery.refetch]) // Dependencia simplificada
  );

  useEffect(() => {
    if (prevSlugRef.current !== slug) return;
    podcastByIdQuery.refetch?.();
    setActivated(false);
    prevSlugRef.current = slug;
  }, [slug]);

  useEffect(() => {
    setActivated(false);
  }, [slug]);

  const allEpisodes: Episode[] =
    podcastEpisodesQuery.data?.pages.flatMap(
      (page) => page.episodes // <-- Accede a 'stations' dentro de cada 'page'
    ) ?? [];

  // 2. FILTRADO: Limpia los duplicados antes de guardarlos en el estado
  const uniqueEpisodes = filterUniqueEpisodes(allEpisodes);

  // 🔹 Buscar el índice del episodio recibido por query (?episode=)
  const episodeIndex = episode
    ? uniqueEpisodes.findIndex((ep) => ep.id === episode)
    : -1;

  // 🔹 Scroll automático al episodio (solo si existe)
  useEffect(() => {
    if (episodeIndex >= 0 && scrollViewRef.current) {
      // ajusta 250 a la altura aproximada de tu card
      const yPosition = episodeIndex * 250;
      scrollViewRef.current.scrollTo({ y: yPosition, animated: true });
    }
  }, [episodeIndex]);

  // Loading UI
  if (isConnected === null || podcastByIdQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator />
        <ThemedText>Cargando el podcast... 🎙</ThemedText>
      </View>
    );
  }
  // exp://192.168.100.58:8081
  //

  // 2️⃣ Sin conexión (modo offline)
  if (!isConnected) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold">
          Sin conexión a Internet
        </ThemedText>
        <ThemedText className="text-gray-500 text-center my-2">
          Puedes escuchar tus episodios descargados o reconectarte para ver más
          contenido.
        </ThemedText>

        <Button
          title="Reintentar"
          onPress={async () => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              Alert.alert(
                "Sin conexión",
                "Aún no tienes Internet. Revisa tu red y vuelve a intentarlo."
              );
              return;
            }
            podcastByIdQuery.refetch(); // solo si realmente hay conexión
          }}
        />
      </View>
    );
  }

  // No data -> redirect safe
  if (!podcastData) {
    return <Redirect href="/podcast" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: podcastData?.podcast.titleEncabezado ?? "Detalles del podcast",
          headerShown: true, // si quieres mostrarlo
        }}
      />

      <ScrollView
        className="flex-1 bg-light-background dark:bg-dark-background"
        ref={scrollViewRef}
      >
        <View className="px-1">
          <PodcastHeader podcast={podcastData.podcast} />
        </View>
        <>
          {podcastByIdQuery.isLoading && (
            <>
              <ThemedView className="flex-1 items-center justify-center">
                <ActivityIndicator color={"#f43f5e"} />
                <ThemedText>Cargando episodios... 🎙</ThemedText>
              </ThemedView>
            </>
          )}

          {podcastByIdQuery.isError && (
            <>
              <ThemedView className="flex-1 items-center justify-center">
                <ActivityIndicator color={"#f43f5e"} />
                <ThemedText>Error al cargar episodios... 🎙</ThemedText>
              </ThemedView>
            </>
          )}

          <EpisodesList
            episodes={uniqueEpisodes}
            highlightedEpisodeId={episode} // <-- agrega esta prop
            // episodes={allEpisodes}
            loadNextPage={loadNextPage}
            isFetching={isFetching}
            hasNextPage={hasNextPage}
            loadPreviousPage={loadPreviousPage}
            hasPreviousPage={hasPreviousPage}
          />
        </>

        {/* Scroll Horizontal */}
        <RelatedPodcasts
          title={`${podcastData.relatedPodcast.title}`}
          despription={`${podcastData.relatedPodcast.description}`}
          podcast={
            podcastData.relatedPodcast
              ? [podcastByIdQuery.data?.relatedPodcast]
              : ([] as any)
          }
          loadNextPage={() => console.log("Cargar más relacionados...")}
        />

        <ThemedView className={`${streamUrl ? "mb-32" : null}`}>
          <Comentarios
            title={podcastData.podcast.titleEncabezado}
            type="podcast"
            entityId={podcastData.podcast.id}
            cantidad={podcastData.podcast.commentsCount}
          />
        </ThemedView>
      </ScrollView>
    </>
  );
}
