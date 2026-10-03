import { ActivityIndicator, View } from "react-native";
import { ContinueListening, RecentlyPlayedSection } from "@/presentation/listening/ListeningCards";
import { RecommendationsSection } from "@/presentation/listening/RecommendationsSection";
import { useHomeListening } from "@/presentation/listening/useHomeListening";
import { PopularCategoriesPodcast } from "../podcast/components/PopularCategoriesPodcast ";
import { TopPodcast } from "../podcast/components/TopPodcast";
import { PopularCategoriesStation } from "../radio/components/PopularCategoriesStation";
import { TopStation } from "../radio/components/TopStation";
import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";
import ThemedText from "../theme/components/themed-text";

export default function HomeHistorySection() {
  const { recentlyPlayed, continuing, radioRecommendations, podcastRecommendations,
    radioSeedTitle, podcastSeedTitle, historyLoading, historyError } = useHomeListening();
  const streamUrl = useAudioPlayerStore(state => state.streamUrl);
  return <View>
    <ContinueListening episodes={continuing} />
    {historyLoading && <ActivityIndicator className="mt-4" size="small" color="#f43f5e" />}
    {historyError && <ThemedText className="mx-4 mt-4">No se pudo cargar el historial.</ThemedText>}
    <RecentlyPlayedSection items={recentlyPlayed} continuing={continuing} />
    <RecommendationsSection seedTitle={radioSeedTitle} type="radio" radioItems={radioRecommendations} />
    <TopStation />
    <PopularCategoriesStation />
    <RecommendationsSection seedTitle={podcastSeedTitle} type="podcast" podcastItems={podcastRecommendations} />
    <TopPodcast />
    <View className={streamUrl ? "mb-60" : "mb-40"}><PopularCategoriesPodcast /></View>
  </View>;
}
