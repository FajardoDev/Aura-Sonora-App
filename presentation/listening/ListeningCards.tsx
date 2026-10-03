import { mediaListContentStyle } from "./media-card-layout";
import PodcastGridItem from "@/presentation/podcast/components/PodcastGridItem";
import RadioGridItem from "@/presentation/radio/components/RadioGridItem";
import { useMemo } from "react";
import { FlatList, View } from "react-native";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
import { RecentEpisode } from "./listening-model";
import { RecentlyPlayed } from "./useHomeListening";

export function resumeEpisode(episode: RecentEpisode) {
  const download = useDownloadsStore.getState().getDownloadedEpisode(episode.episodeId);
  useAudioPlayerStore.getState().setStream(download?.uri || episode.remoteStream || episode.stream, episode.title, episode.artwork,
    episode.podcastSlug, episode.podcastId, episode.episodeSlug, "podcast",
    { source: episode, resumePosition: episode.completed ? 0 : episode.position });
}

export function ContinueListening({ episodes }: { episodes: RecentEpisode[] }) {
  if (!episodes.length) return null;
  return <View className="mt-5">
    <ThemedText className="text-lg font-bold mx-4">Continúa escuchando</ThemedText>
    <ThemedText className="text-zinc-400 text-xs mx-4 mt-1 mb-2">Retoma tus episodios donde los dejaste.</ThemedText>
    <FlatList horizontal data={episodes} keyExtractor={e => e.episodeId} showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 11 }} renderItem={({ item }) => (
        <PodcastGridItem variant="compact" podcast={{ id: item.podcastId, slug: item.podcastSlug, image: item.artwork || "", titleEncabezado: item.title }}
          continuation={{ podcastTitle: item.podcastTitle, position: item.position, duration: item.duration, onContinue: () => resumeEpisode(item) }} />
      )} />
  </View>;
}

function RecentCard({ item }: { item: RecentlyPlayed }) {
  if (item.radio) {
    const r = item.radio;
    return <RadioGridItem variant="compact" emisora={{ id: r.radioId, slug: r.slug,
      radioname: r.title, radioimg: r.artwork, stream: r.stream, radioid: r.radioid,
      categories: r.categories, locations: r.locations,
      commentsCount: r.commentsCount, averageRating: r.averageRating }} />;
  }
  if (item.backend?.type === "radio") {
    const r = item.backend;
    return <RadioGridItem variant="compact" emisora={{ id: r.id, slug: r.slug,
      radioname: r.radioname || r.title, radioimg: r.image || "", stream: r.stream || "",
      isFavorite: r.isFavorite, commentsCount: r.commentsCount, averageRating: r.averageRating }} />;
  }
  if (item.backend) return <PodcastGridItem variant="compact" podcast={{ id: item.backend.id, slug: item.backend.slug,
    titleEncabezado: item.backend.title, titleSecond: item.backend.subtitle || "", image: item.backend.image || "",
    isFavorite: item.backend.isFavorite, commentsCount: item.backend.commentsCount, averageRating: item.backend.averageRating }} />;
  if (!item.episode) return null;
  return <PodcastGridItem variant="compact" podcast={{ ...item.podcast, id: item.episode.podcastId, slug: item.episode.podcastSlug,
    image: item.artwork || item.podcast?.image || "", titleEncabezado: item.title,
    titleSecond: item.podcast?.titleSecond || item.episode.podcastTitle }}
    onPress={() => { if (item.episode) resumeEpisode(item.episode); }} />;
}

export function RecentlyPlayedSection({ items, continuing }: { items: RecentlyPlayed[]; continuing: RecentEpisode[] }) {
  const { radios, podcasts } = useMemo(() => {
    const ids = new Set<string>();
    const recent = items.filter(item => { if (ids.has(item.key)) return false; ids.add(item.key); return true; });
    const continuingPodcasts = new Set(continuing.map(e => e.podcastSlug));
    return {
      radios: recent.filter(item => !!item.radio || item.backend?.type === "radio").slice(0, 10),
      podcasts: recent.filter(item => !!item.episode || item.backend?.type === "podcast")
        .filter(item => !continuingPodcasts.has(item.episode?.podcastSlug || item.backend?.slug || "")).slice(0, 10),
    };
  }, [items, continuing]);
  return <>
    {[{ title: "Últimas radios escuchadas", data: radios }, { title: "Podcasts escuchados recientemente", data: podcasts }]
      .filter(section => section.data.length > 0).map(section => <View className="mt-5" key={section.title}>
        <ThemedText className="text-lg font-bold mx-4 mb-2">{section.title}</ThemedText>
        <FlatList horizontal data={section.data} keyExtractor={item => item.key} showsHorizontalScrollIndicator={false}
          contentContainerStyle={mediaListContentStyle} renderItem={({ item }) => <RecentCard item={item} />} />
      </View>)}
  </>;
}
