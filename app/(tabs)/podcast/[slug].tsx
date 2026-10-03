import { Episode } from "@/core/radio-podcast/interface/podcast/podcast-episodes.interface";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import EpisodesList from "@/presentation/podcast/components/EpisodesList";
import PodcastGridItem from "@/presentation/podcast/components/PodcastGridItem";
import PodcastHeader from "@/presentation/podcast/components/PodcastHeader";
import PodcastSectionList from "@/presentation/podcast/components/PodcastSectionList";
import { usePodcastById } from "@/presentation/podcast/hooks/usePodcastById";
import { usePodcastEpisodes } from "@/presentation/podcast/hooks/usePodcastEpisodes";
import Comentarios from "@/presentation/radio/components/Comentarios";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { filterUniqueEpisodes } from "@/utils/filterUniqueEpisodes";
import NetInfo from "@react-native-community/netinfo";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Section = "episodes" | "similar" | "opinions";
const sections: { key: Section; label: string }[] = [
  { key: "episodes", label: "Episodios" },
  { key: "similar", label: "Similares" },
  { key: "opinions", label: "Opiniones" },
];

export default function PodcastDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  // Reset section state when the router reuses this screen for another podcast.
  return <PodcastDetailContent key={slug} slug={slug} />;
}

function PodcastDetailContent({ slug }: { slug: string }) {
  const { episode } = useLocalSearchParams<{ episode?: string }>();
  const [section, setSection] = useState<Section>("episodes");
  const [visited, setVisited] = useState<Section[]>(["episodes"]);
  const { isConnected } = useNetworkStatus();
  const streamUrl = useAudioPlayerStore(state => state.streamUrl);
  const playerType = useAudioPlayerStore(state => state.type);
  const insets = useSafeAreaInsets();
  const { podcastByIdQuery } = usePodcastById(slug);
  const podcastData = podcastByIdQuery.data;
  const { podcastEpisodesQuery, hasNextPage, isFetching, loadNextPage } =
    usePodcastEpisodes(podcastData?.podcast.id || "");

  useFocusEffect(useCallback(() => {
    podcastByIdQuery.refetch();
  }, [podcastByIdQuery.refetch]));

  const uniqueEpisodes = useMemo<Episode[]>(() => filterUniqueEpisodes(
    podcastEpisodesQuery.data?.pages.flatMap(page => page.episodes) || [],
  ), [podcastEpisodesQuery.data]);
  const episodeIndex = episode
    ? uniqueEpisodes.findIndex(ep => ep.id === episode || ep.slug === episode) : -1;

  useEffect(() => { if (episode) setSection("episodes"); }, [episode]);
  // A shared episode link can point beyond the first page. Load sequentially only for that link.
  useEffect(() => {
    if (episode && episodeIndex < 0 && hasNextPage && !isFetching && !podcastEpisodesQuery.isError) {
      loadNextPage();
    }
  }, [episode, episodeIndex, hasNextPage, isFetching, loadNextPage, podcastEpisodesQuery.isError]);

  const related = useMemo(() => {
    const seen = new Set<string>();
    return (podcastData?.relatedPodcast?.items || []).filter(item => {
      if (item.id === podcastData?.podcast.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [podcastData]);
  const relatedRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < related.length; i += 3) rows.push(related.slice(i, i + 3));
    return rows;
  }, [related]);

  if (isConnected === null || podcastByIdQuery.isLoading) return <ThemedView className="flex-1 items-center justify-center">
    <ActivityIndicator color="#f43f5e" /><ThemedText>Cargando el podcast…</ThemedText>
  </ThemedView>;

  if (!isConnected) return <ThemedView className="flex-1 justify-center items-center p-4">
    <ThemedText className="text-lg font-semibold">Sin conexión a Internet</ThemedText>
    <ThemedText className="text-zinc-400 text-center my-2">Puedes escuchar tus episodios descargados o reconectarte para ver más contenido.</ThemedText>
    <Button title="Reintentar" onPress={async () => {
      const state = await NetInfo.fetch();
      if (!state.isConnected) {
        Alert.alert("Sin conexión", "Aún no tienes Internet. Revisa tu red y vuelve a intentarlo.");
        return;
      }
      podcastByIdQuery.refetch();
    }} />
  </ThemedView>;

  if (!podcastData) return <ThemedView className="flex-1 justify-center items-center p-4">
    <ThemedText>No se pudo cargar el podcast.</ThemedText>
    <Button title="Reintentar" onPress={() => podcastByIdQuery.refetch()} />
  </ThemedView>;

  const selectSection = (next: Section) => {
    setVisited(current => current.includes(next) ? current : [...current, next]);
    setSection(next);
  };
  const navigation = <View className="flex-row mx-4 py-3" accessibilityRole="tablist">
    {sections.map(({ key, label }) => <TouchableOpacity key={key}
      accessibilityRole="tab" accessibilityState={{ selected: section === key }}
      onPress={() => selectSection(key)} activeOpacity={0.8}
      className={`flex-1 py-3 rounded-xl ${section === key ? "bg-rose-500" : "bg-zinc-500/10"}`}
      style={{ marginHorizontal: 3 }}>
      <ThemedText className={`text-center text-sm font-semibold ${section === key ? "text-white" : "text-zinc-500 dark:text-zinc-300"}`}>{label}</ThemedText>
    </TouchableOpacity>)}
  </View>;
  const header = <PodcastHeader podcast={podcastData.podcast} />;
  // The player floats 88px above the bottom; reserve its full height and safe area.
  const bottomInset = (streamUrl ? 88 + (playerType === "podcast" ? 105 : 80) : 90)
    + insets.bottom + 24;
  const layout = { header, navigation, bottomInset };

  return <ThemedView className="flex-1">
    <Stack.Screen options={{ title: podcastData.podcast.titleEncabezado, headerShown: true }} />
    <View style={{ flex: 1, display: section === "episodes" ? "flex" : "none" }}>
      <EpisodesList {...layout} active={section === "episodes"} episodes={uniqueEpisodes}
        highlightedEpisodeId={episode} loadNextPage={loadNextPage}
        isFetching={isFetching} hasNextPage={hasNextPage}
        error={podcastEpisodesQuery.isError} onRetry={() => podcastEpisodesQuery.refetch()} />
    </View>
    {visited.includes("similar") && <View style={{ flex: 1, display: section === "similar" ? "flex" : "none" }}>
      <PodcastSectionList {...layout} active={section === "similar"}
        items={relatedRows} itemKey={row => row[0].id}
        intro={<ThemedText className="mx-4 mt-4 mb-3 text-lg font-semibold">Podcasts que también te pueden gustar</ThemedText>}
        empty={<ThemedText className="mx-4 my-6 text-zinc-400">Todavía no hay podcasts similares disponibles.</ThemedText>}
        renderItem={row => <View className="flex-row px-3">
          {row.map(item => <View key={item.id} style={{ flex: 1 }}><PodcastGridItem podcast={item} fullWidth /></View>)}
          {Array.from({ length: 3 - row.length }, (_, index) => <View key={`empty:${index}`} style={{ flex: 1 }} />)}
        </View>} />
    </View>}
    {visited.includes("opinions") && <View style={{ flex: 1, display: section === "opinions" ? "flex" : "none" }}>
      <Comentarios title={podcastData.podcast.titleEncabezado} type="podcast"
        entityId={podcastData.podcast.id} cantidad={podcastData.podcast.commentsCount}
        averageRating={podcastData.podcast.averageRating}
        sectionLayout={{ ...layout, active: section === "opinions" }} />
    </View>}
  </ThemedView>;
}
