import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { getImageUrl } from "./PodcastGridItem";

export default function DownloadedEpisodesList() {
  const { downloads, removeDownload, loadDownloads } = useDownloadsStore();

  const { isConnected } = useNetworkStatus();

  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();
  const [activatedId, setActivatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadDownloads();
      setLoading(false);
    };
    init();
  }, []);

  // const handlePlayClicks = (item: any) => {
  // 	if (!item.uri) return;

  // 	const img = getImageUrl(item.image);

  // 	// Si ya se está reproduciendo → pausar / reanudar
  // 	if (streamUrl === item.uri) {
  // 		togglePlay();
  // 		setActivatedId(item.id);
  // 		return;
  // 	}

  // 	setStream(
  // 		item.uri,
  // 		item.title,
  // 		img!,
  // 		item.podcastTitle || "Podcast",
  // 		item.podcastId || "",
  // 		"podcast",
  // 	);

  // 	setActivatedId(item.id);
  // };

  const handlePlayClick = async (item: any) => {
    if (!item.uri) return;

    try {
      const fileInfo = await FileSystem.getInfoAsync(item.uri);
      if (!fileInfo.exists) {
        Alert.alert(
          "Archivo no encontrado",
          "El episodio fue eliminado del almacenamiento."
        );
        return;
      }
    } catch (error) {
      console.log("Error verificando archivo:", error);
    }

    const img = getImageUrl(item.image);

    // console.log({ img });

    // 🎧 Si ya se está reproduciendo → pausar / reanudar
    if (streamUrl === item.uri) {
      togglePlay();
      setActivatedId(item.id);
      return;
    }

    setStream(
      item.uri, // local file://...
      item.title,
      img!,
      item.podcastTitle || "Podcast",
      item.podcastId || "",
      item.slug || "",
      // item.isFavorite || "",
      "podcast" // 👈 tu tipo ya existente
    );

    setActivatedId(item.id);
  };

  if (isConnected === null || loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="#f43f5e" />
        <ThemedText className="text-gray-400 mt-2">
          Cargando descargas...
        </ThemedText>
      </View>
    );
  }

  if (downloads.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <ThemedText className="text-gray-400 text-center">
          No tienes descargas aún 🎧
        </ThemedText>
      </View>
    );
  }

  return (
    <FlatList
      data={downloads}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: streamUrl ? 250 : 220 }}
      // contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isCurrent = streamUrl === item.uri;
        const showAsPlaying = isCurrent && isPlaying;

        return (
          <View className="bg-black/5 dark:bg-white/5 rounded-2xl mb-3 p-3 border border-white/10 border-l-2 border-l-rose-600">
            <View className="flex-row items-center justify-between rounded-md">
              {/* Imagen */}
              <Image
                source={
                  item.image
                    ? { uri: getImageUrl(item.image), cache: "force-cache" }
                    : require("../../../assets/images/radio-podcast.jpg")
                }
                style={{
                  width: 75,
                  height: 75,
                  borderRadius: 15,
                  marginRight: 7,
                }}
                contentFit="cover"
                transition={500}
              />

              {/* Info */}
              <View className="flex-1 mr-3">
                {item.podcastTitle ? (
                  <ThemedText
                    className="text-lg mb-2 leading-5 font-bold"
                    numberOfLines={1}
                  >
                    {item.podcastTitle}
                  </ThemedText>
                ) : null}

                <ThemedText className="text-sm font-semibold" numberOfLines={1}>
                  {item.title}
                </ThemedText>

                <ThemedText className="text-xs mt-1">
                  Descargado localmente
                </ThemedText>
              </View>

              {/* Botones */}
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => handlePlayClick(item)}
                  className="bg-black/5 dark:bg-white p-2 rounded-full mr-3"
                >
                  <Ionicons
                    name={
                      showAsPlaying ? "pause-circle" : "play-circle-outline"
                    }
                    size={38}
                    color="#ef4444"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeDownload(item.id)}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Descripción */}
            {item.description ? (
              <ThemedText className="text-sm mt-3 leading-5" numberOfLines={4}>
                {item.description}
              </ThemedText>
            ) : null}
          </View>
        );
      }}
    />
  );
}
