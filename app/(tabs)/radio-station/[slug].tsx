import { useAuthNavigation } from "@/presentation/auth/hooks/useAuthNavigation";
import { API_URL } from "@/core/api/radioPodcastApi";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import Comentarios from "@/presentation/radio/components/Comentarios";
import RadioDetails from "@/presentation/radio/components/RadioDetails";
import RadioGridItem from "@/presentation/radio/components/RadioGridItem";
import DetailSectionList from "@/presentation/podcast/components/PodcastSectionList";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCachedNowPlaying } from "@/presentation/radio/hooks/useCachedNowPlaying";
import { useRadioStationBySlug } from "@/presentation/radio/hooks/useRadioStationBySlug";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import { stationPresentation } from "@/presentation/radio/utils/stationPresentation";
import { ThemedCard } from "@/presentation/theme/components/ThemedCard";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Redirect, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Share, View } from "react-native";

type Section = "information" | "similar" | "opinions";
const sections: { key: Section; label: string }[] = [
  { key: "information", label: "Información" },
  { key: "similar", label: "Similares" },
  { key: "opinions", label: "Opiniones" },
];

export default function DetallesSlugScreenEmisoras() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <RadioDetailContent key={slug} slug={slug} />;
}

function RadioDetailContent({ slug }: { slug: string }) {
  const [section, setSection] = useState<Section>("information");
  const [visited, setVisited] = useState<Section[]>(["information"]);
  const insets = useSafeAreaInsets();
  const { isConnected } = useNetworkStatus();
  const { requireAuth } = useAuthNavigation();
  const { streamUrl, slug: activeSlug, type, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const { radioStationBySlugQuery: query } = useRadioStationBySlug(slug);
  const { mutate: toggleFavorite, isPending: favoritePending } = useToggleFavorite();
  const [actionError, setActionError] = useState<string | null>(null);
  const radio = query.data?.data;
  const isCurrentStation = !!radio && type === "radio" && activeSlug === radio.slug && streamUrl === radio.stream;
  const song = useCachedNowPlaying(radio?.slug || "", radio?.stream || "", isCurrentStation);
  const songTitle = song?.title || song?.rawTitle;

  const relatedRows = useMemo(() => {
    const seen = new Set<string>();
    const items = (query.data?.relatedStations?.items || []).filter(item => {
      if (item.id === radio?.id || item.slug === radio?.slug || seen.has(item.slug)) return false;
      seen.add(item.slug);
      return true;
    });
    const rows = [];
    for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
    return rows;
  }, [query.data, radio?.id, radio?.slug]);

  useFocusEffect(useCallback(() => { query.refetch(); }, [query.refetch]));

  const handlePlay = () => {
    if (!radio?.stream) return;
    if (isCurrentStation) togglePlay();
    else setStream(radio.stream, radio.radioname, radio.radioimg, radio.slug, radio.radioid, "", "radio");
  };
  const handleFavorite = () => {
    if (!radio || favoritePending) return;
    if (!requireAuth()) return;
    setActionError(null);
    toggleFavorite({ type: "radio", radioSlug: radio.slug, radioStationId: radio.id }, {
      onError: () => setActionError("No se pudo actualizar el favorito. Intenta nuevamente."),
    });
  };
  const handleShare = async () => {
    if (!radio) return;
    setActionError(null);
    try {
      await Share.share({ title: radio.radioname,
        message: `Escucha ${radio.radioname} en Aura Sonora: ${API_URL}/radio-station/${radio.slug}` });
    } catch { setActionError("No se pudo compartir esta emisora."); }
  };

  if (isConnected === null || query.isLoading) return (
    <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
      <ActivityIndicator color="#f43f5e" />
      <ThemedText className="mt-3">Cargando la emisora...</ThemedText>
    </View>
  );
  if (!isConnected || query.isError) return (
    <View className="flex-1 justify-center items-center p-6 bg-light-background dark:bg-dark-background">
      <Ionicons name="cloud-offline-outline" size={40} color="#f43f5e" />
      <ThemedText className="text-lg font-Roboto-Bold text-center mt-4">{!isConnected ? "Sin conexión a Internet" : "No se pudo cargar la emisora"}</ThemedText>
      <ThemedText className="text-sm opacity-60 text-center mt-2">{!isConnected ? "Revisa tu conexión y vuelve a intentarlo." : "Intenta nuevamente en unos momentos."}</ThemedText>
      <Pressable onPress={() => query.refetch()} accessibilityRole="button" className="bg-rose-500 rounded-full px-6 py-3 mt-5">
        <ThemedText className="text-white">Reintentar</ThemedText>
      </Pressable>
    </View>
  );
  if (!radio) return <Redirect href="/radio-station" />;
  const details = stationPresentation(radio);
  const related = query.data?.relatedStations;

  const selectSection = (next: Section) => {
    setVisited(current => current.includes(next) ? current : [...current, next]);
    setSection(next);
  };
  const navigation = <View className="flex-row mx-4 py-3" accessibilityRole="tablist">
    {sections.map(({ key, label }) => <Pressable key={key}
      accessibilityRole="tab" accessibilityState={{ selected: section === key }}
      onPress={() => selectSection(key)}
      className={`flex-1 py-3 rounded-xl ${section === key ? "bg-rose-500" : "bg-zinc-500/10"}`}
      style={{ marginHorizontal: 3 }}>
      <ThemedText className={`text-center text-sm font-semibold ${section === key ? "text-white" : "text-zinc-500 dark:text-zinc-300"}`}>{label}</ThemedText>
    </Pressable>)}
  </View>;
  const header = <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
          <LinearGradient colors={["#011016", "#25304b", "#361c38"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center bg-rose-500/15 px-3 py-2 rounded-full">
                <View className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                <ThemedText className="text-rose-400 text-xs font-Roboto-Bold">EN VIVO</ThemedText>
              </View>
              <Pressable onPress={handleShare} accessibilityRole="button" accessibilityLabel="Compartir emisora"
                className="w-12 h-12 rounded-full bg-white/10 items-center justify-center active:opacity-60">
                <Ionicons name="share-social-outline" size={22} color="white" />
              </Pressable>
            </View>
            <View className="items-center">
              <View className="bg-white rounded-3xl p-3" style={{ shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }}>
                <Image source={radio.radioimg ? { uri: radio.radioimg } : require("../../../assets/images/radios.png")}
                  placeholder={require("../../../assets/images/radios.png")} contentFit="contain" transition={200}
                  accessibilityLabel={`Logo de ${radio.radioname}`} style={{ width: 144, height: 144, borderRadius: 12 }} />
              </View>
              <ThemedText className="font-Roboto-ExtraBold text-center mt-5" style={{ color: "white", fontSize: 28, lineHeight: 34 }}>{radio.radioname}</ThemedText>
              {!!details.frequency && <ThemedText className="text-rose-400 font-Roboto-SemiBold text-lg mt-2">{details.frequency}</ThemedText>}
              {details.locations.length > 0 && <View className="flex-row items-start mt-3">
                <Ionicons name="location-outline" size={16} color="#cbd5e1" style={{ marginRight: 5, marginTop: 2 }} />
                <ThemedText className="text-sm text-slate-300 text-center flex-shrink" style={{ flexShrink: 1 }}>{details.locations.join(" · ")}</ThemedText>
              </View>}
              {details.categories.length > 0 && <View className="flex-row flex-wrap justify-center mt-4">
                {details.categories.map(category => <Link key={category} href={{ pathname: "/radio-station/categoria/[categoria]", params: { categoria: category } }} asChild>
                  <Pressable accessibilityRole="link" className="bg-white/10 rounded-full px-3 py-2 mr-2 mb-2 active:opacity-60">
                    <ThemedText className="text-xs text-slate-200">{category}</ThemedText>
                  </Pressable>
                </Link>)}
              </View>}
            </View>
            <View className="flex-row items-center mt-5" style={{ gap: 12 }}>
              <Pressable onPress={handlePlay} disabled={!radio.stream} accessibilityRole="button"
                accessibilityLabel={isCurrentStation && isPlaying ? "Pausar emisora" : "Reproducir emisora"}
                className="flex-1 flex-row items-center justify-center bg-rose-500 rounded-2xl py-4 active:opacity-70" style={{ opacity: radio.stream ? 1 : 0.5 }}>
                <Ionicons name={isCurrentStation && isPlaying ? "pause" : "play"} size={23} color="white" />
                <ThemedText className="text-white font-Roboto-Bold ml-2">{isCurrentStation && isPlaying ? "Pausar" : "Escuchar en vivo"}</ThemedText>
              </Pressable>
              <Pressable onPress={handleFavorite} disabled={favoritePending} accessibilityRole="button"
                accessibilityLabel={radio.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"} accessibilityState={{ selected: radio.isFavorite, disabled: favoritePending }}
                className="bg-white/10 rounded-2xl items-center justify-center active:opacity-60" style={{ width: 56, minHeight: 56 }}>
                {favoritePending ? <ActivityIndicator color="#fb7185" /> : <Ionicons name={radio.isFavorite ? "heart" : "heart-outline"} size={25} color="#fb7185" />}
              </Pressable>
            </View>
            {actionError && <ThemedText accessibilityRole="alert" className="text-rose-300 text-sm mt-3">{actionError}</ThemedText>}
          </LinearGradient>
  </View>;
  const bottomInset = (streamUrl ? 88 + (type === "podcast" ? 105 : 80) : 90) + insets.bottom + 24;
  const layout = { header, navigation, bottomInset };
  const information = <View className="px-4 pt-5" style={{ gap: 16 }}>
            {isCurrentStation && !!songTitle && <ThemedCard className="p-5 rounded-3xl border border-rose-500/20">
              <View className="flex-row items-center mb-4">
                <Ionicons name="musical-notes-outline" size={17} color="#f43f5e" />
                <ThemedText className="text-xs text-rose-500 font-Roboto-Bold ml-2">{isPlaying ? "SONANDO AHORA" : "ÚLTIMA CANCIÓN"}</ThemedText>
              </View>
              <View className="flex-row items-center">
                <Image source={{ uri: song?.artworkUrl || radio.radioimg }} placeholder={require("../../../assets/images/radios.png")}
                  contentFit={song?.artworkUrl ? "cover" : "contain"} transition={200} style={{ width: 76, height: 76, borderRadius: 16, marginRight: 16, backgroundColor: "white" }} />
                <View className="flex-1">
                  <ThemedText className="font-Roboto-Bold text-base leading-6">{songTitle}</ThemedText>
                  {!!song?.artist && <ThemedText className="text-sm opacity-60 mt-1">{song.artist}</ThemedText>}
                  <ThemedText className="text-xs text-rose-500 mt-2">{isPlaying ? "En vivo" : "En pausa"}</ThemedText>
                </View>
              </View>
            </ThemedCard>}
            <RadioDetails key={radio.slug} radio={radio} />
          </View>;

  return <ThemedView className="flex-1">
    <Stack.Screen options={{ title: radio.radioname, headerShown: true,
        headerTitle: () => <ThemedText numberOfLines={1} className="font-Roboto-Bold" style={{ color: "white", fontSize: 16, maxWidth: 240, marginBottom: Platform.OS === "ios" ? 40 : 30 }}>{radio.radioname}</ThemedText>,
      }} />
    <View style={{ flex: 1, display: section === "information" ? "flex" : "none" }}>
      <DetailSectionList {...layout} active={section === "information"}
        items={[radio]} itemKey={item => item.id} renderItem={() => information} />
    </View>
    {visited.includes("similar") && <View style={{ flex: 1, display: section === "similar" ? "flex" : "none" }}>
      <DetailSectionList {...layout} active={section === "similar"}
        items={relatedRows} itemKey={row => row[0].id}
        intro={<ThemedText className="mx-4 mt-4 mb-3 text-lg font-semibold">{related?.title || "Emisoras que también te pueden gustar"}</ThemedText>}
        empty={<ThemedText className="mx-4 my-6 text-zinc-400">Todavía no hay emisoras similares disponibles.</ThemedText>}
        renderItem={row => <View className="flex-row px-3">
          {row.map(item => <View key={item.id} style={{ flex: 1 }}>
            <RadioGridItem emisora={item} variant="compact" fullWidth />
          </View>)}
          {Array.from({ length: 3 - row.length }, (_, index) => <View key={`empty:${index}`} style={{ flex: 1 }} />)}
        </View>} />
    </View>}
    {visited.includes("opinions") && <View style={{ flex: 1, display: section === "opinions" ? "flex" : "none" }}>
      <Comentarios title={radio.radioname} type="radio" entityId={radio.id}
        cantidad={radio.commentsCount} averageRating={radio.averageRating}
        sectionLayout={{ ...layout, active: section === "opinions" }} />
    </View>}
  </ThemedView>;
}
