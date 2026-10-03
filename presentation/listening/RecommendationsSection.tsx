import { mediaListContentStyle } from "./media-card-layout";
import PodcastGridItem, { type PodcastCardData } from "@/presentation/podcast/components/PodcastGridItem";
import { FlatList, View } from "react-native";
import ThemedText from "@/presentation/theme/components/themed-text";
import RadioGridItem, { RadioCardStation } from "@/presentation/radio/components/RadioGridItem";

export function RecommendationsSection({ seedTitle, type, podcastItems = [], radioItems = [] }: {
  seedTitle?: string; type: "radio" | "podcast"; podcastItems?: PodcastCardData[]; radioItems?: RadioCardStation[];
}) {
  if (!seedTitle || !(type === "radio" ? radioItems.length : podcastItems.length)) return null;
  return <View className="mt-6">
    <ThemedText className="text-lg font-bold mx-4 mb-2">Porque escuchaste {seedTitle}</ThemedText>
    {type === "radio" ? <FlatList horizontal data={radioItems} keyExtractor={item => item.slug} showsHorizontalScrollIndicator={false}
      contentContainerStyle={mediaListContentStyle}
      renderItem={({ item }) => <RadioGridItem emisora={item} variant="compact" />} />
      : <FlatList horizontal data={podcastItems} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false}
        contentContainerStyle={mediaListContentStyle} renderItem={({ item }) => (
          <PodcastGridItem variant="compact" podcast={item} />
        )} />}
  </View>;
}
