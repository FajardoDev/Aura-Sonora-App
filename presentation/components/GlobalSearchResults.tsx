import type { useGlobalSearch } from "@/presentation/hooks/useGlobalSearch";
import type { Podcasts, Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import PodcastGridItem from "@/presentation/podcast/components/PodcastGridItem";
import RadioGridItem from "@/presentation/radio/components/RadioGridItem";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useRouter } from "expo-router";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

type Media = "radio" | "podcast";
export type SearchRow =
  | { key: string; kind: "heading"; media: Media; total: number; refreshing: boolean }
  | { key: string; kind: "status"; media?: Media; message: string; loading?: boolean; error?: boolean }
  | { key: string; kind: "radios"; items: Station[] }
  | { key: string; kind: "podcasts"; items: Podcasts[] };

export function buildSearchRows(search: ReturnType<typeof useGlobalSearch>, waiting: boolean): SearchRow[] {
  if (waiting) return [{ key: "waiting", kind: "status", message: "Buscando contenido…", loading: true }];
  const rows: SearchRow[] = [];
  const { radioStationQuery: radios, podcastQuery: podcasts } = search;
  const radioPreview = search.radios;
  const podcastPreview = search.podcasts;
  for (const media of ["radio", "podcast"] as const) {
    const result = media === "radio" ? radios : podcasts;
    const items = media === "radio" ? radioPreview : podcastPreview;
    const total = media === "radio" ? radios.data?.pages?.[0]?.totalItems : podcasts.data?.pages?.[0]?.meta?.totalItems;
    rows.push({ key: `${media}-heading`, kind: "heading", media,
      total: result.isPlaceholderData ? 0 : total ?? items.length,
      refreshing: result.isFetching && items.length > 0 });
    if (!items.length && (result.isPending || result.isFetching)) {
      rows.push({ key: `${media}-loading`, kind: "status", media, message: `Buscando ${media === "radio" ? "radios" : "podcasts"}…`, loading: true });
    } else if (result.isError) {
      rows.push({ key: `${media}-error`, kind: "status", media, message: `No se pudieron cargar ${media === "radio" ? "las radios" : "los podcasts"}.`, error: true });
    } else if (!items.length) {
      rows.push({ key: `${media}-empty`, kind: "status", media, message: `No se encontraron ${media === "radio" ? "radios" : "podcasts"}.` });
    }
    for (let index = 0; index < items.length; index += 3) {
      const key = `${media}-${items[index].id}`;
      rows.push(media === "radio"
        ? { key, kind: "radios", items: radioPreview.slice(index, index + 3) }
        : { key, kind: "podcasts", items: podcastPreview.slice(index, index + 3) });
    }
  }
  return rows;
}

export function GlobalSearchResultRow({ row, query, onRetry }: {
  row: SearchRow; query: string; onRetry: (media: Media) => void;
}) {
  const router = useRouter();
  if (row.kind === "heading") return <View className="flex-row items-center justify-between mx-3 mt-4 mb-2">
    <View className="flex-row items-center">
      <ThemedText className="text-xl font-bold">{row.media === "radio" ? "Radios" : "Podcasts"}</ThemedText>
      {row.refreshing && <ActivityIndicator size="small" color="#f43f5e" style={{ marginLeft: 8 }} />}
    </View>
    {row.total > 6 && <TouchableOpacity accessibilityRole="button"
      accessibilityLabel={`Ver todos los resultados de ${row.media === "radio" ? "radios" : "podcasts"}`}
      onPress={() => router.push({ pathname: row.media === "radio" ? "/radio-station" : "/podcast", params: { search: query } })}>
      <ThemedText className="text-rose-500 font-semibold">Ver todos ({row.total})</ThemedText>
    </TouchableOpacity>}
  </View>;
  if (row.kind === "status") return <View className="mx-4 py-5 items-center">
    {row.loading && <ActivityIndicator color="#f43f5e" />}
    <ThemedText className="text-center opacity-70 mt-2">{row.message}</ThemedText>
    {row.error && row.media && <TouchableOpacity accessibilityRole="button" onPress={() => onRetry(row.media!)} className="mt-3 p-2">
      <ThemedText className="text-rose-500 font-semibold">Reintentar</ThemedText>
    </TouchableOpacity>}
  </View>;
  return <View className="flex-row">
    {row.kind === "radios"
      ? row.items.map(item => <RadioGridItem key={item.id} emisora={item} variant="compact" />)
      : row.items.map(item => <PodcastGridItem key={item.id} podcast={item} variant="compact" />)}
  </View>;
}
