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
      contentContainerStyle={{
        paddingHorizontal: 10,
        paddingTop: 5,
        paddingBottom: streamUrl ? 250 : 120,
      }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => {
        const isCurrent = streamUrl === item.uri;
        const showAsPlaying = isCurrent && isPlaying;

        return (
          <View
            className={`
            mb-4 overflow-hidden rounded-3xl border 
            ${
              isCurrent
                ? "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50"
                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
            }
          `}
            style={{
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
            }}
          >
            <View className="px-6 py-5">
              <View className="flex-row items-center rounded-2xl">
                {/* Contenedor de Imagen con Sombra */}
                <View className="shadow-sm">
                  <Image
                    source={
                      item.image
                        ? { uri: getImageUrl(item.image), cache: "force-cache" }
                        : require("../../../assets/images/radio-podcast.jpg")
                    }
                    className="w-20 h-20 rounded-2xl"
                    contentFit="cover"
                    transition={400}
                  />
                  {showAsPlaying && (
                    <View className="absolute inset-0 bg-rose-600/20 items-center justify-center rounded-2xl">
                      <View className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    </View>
                  )}
                </View>

                {/* Contenido Central */}
                <View className="flex-1 ml-4 justify-center">
                  {item.podcastTitle && (
                    <ThemedText
                      className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest mb-0 mt-3"
                      numberOfLines={1}
                    >
                      {item.podcastTitle}
                    </ThemedText>
                  )}

                  <ThemedText
                    className="text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-50"
                    numberOfLines={2}
                  >
                    {item.title}
                  </ThemedText>

                  <View className="flex-row items-center mt-2">
                    <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-md flex-row items-center">
                      <Ionicons name="cloud-done" size={12} color="#22c55e" />
                      <ThemedText className="text-[10px] font-bold text-green-700 dark:text-green-400 ml-1">
                        LOCAL
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Acciones Laterales */}
                <View className="flex-row items-center ml-2">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handlePlayClick(item)}
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      showAsPlaying
                        ? "bg-rose-600"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    <Ionicons
                      name={showAsPlaying ? "pause" : "play"}
                      size={24}
                      color={showAsPlaying ? "#fff" : "#ef4444"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removeDownload(item.id)}
                    className="ml-2 p-2"
                    activeOpacity={0.6}
                  >
                    <Ionicons name="trash-outline" size={20} color="#a1a1aa" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Descripción expandible o sutil */}
              {item.description && (
                <View className="mt-4 pt-4 mb-3 mx-1 border-t border-zinc-50 dark:border-zinc-800">
                  <ThemedText
                    className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed"
                    numberOfLines={2}
                  >
                    {item.description}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        );
      }}
    />
  );

  // return (
  //   <FlatList
  //     data={downloads}
  //     keyExtractor={(item) => item.id}
  //     contentContainerStyle={{ paddingBottom: streamUrl ? 250 : 220 }}
  //     // contentContainerStyle={{ padding: 16 }}
  //     showsVerticalScrollIndicator={false}
  //     renderItem={({ item }) => {
  //       const isCurrent = streamUrl === item.uri;
  //       const showAsPlaying = isCurrent && isPlaying;

  //       return (
  //         <View className="bg-black/5 dark:bg-white/5 rounded-2xl mb-3 p-3 border border-white/10 border-l-2 border-l-rose-600">
  //           <View className="flex-row items-center justify-between rounded-md">
  //             {/* Imagen */}
  //             <Image
  //               source={
  //                 item.image
  //                   ? { uri: getImageUrl(item.image), cache: "force-cache" }
  //                   : require("../../../assets/images/radio-podcast.jpg")
  //               }
  //               style={{
  //                 width: 75,
  //                 height: 75,
  //                 borderRadius: 15,
  //                 marginRight: 7,
  //               }}
  //               contentFit="cover"
  //               transition={500}
  //             />

  //             {/* Info */}
  //             <View className="flex-1 mr-3">
  //               {item.podcastTitle ? (
  //                 <ThemedText
  //                   className="text-lg mb-2 leading-5 font-bold"
  //                   numberOfLines={1}
  //                 >
  //                   {item.podcastTitle}
  //                 </ThemedText>
  //               ) : null}

  //               <ThemedText className="text-sm font-semibold" numberOfLines={1}>
  //                 {item.title}
  //               </ThemedText>

  //               <ThemedText className="text-xs mt-1">
  //                 Descargado localmente
  //               </ThemedText>
  //             </View>

  //             {/* Botones */}
  //             <View className="flex-row items-center">
  //               <TouchableOpacity
  //                 onPress={() => handlePlayClick(item)}
  //                 className="bg-black/5 dark:bg-white p-2 rounded-full mr-3"
  //               >
  //                 <Ionicons
  //                   name={
  //                     showAsPlaying ? "pause-circle" : "play-circle-outline"
  //                   }
  //                   size={38}
  //                   color="#ef4444"
  //                 />
  //               </TouchableOpacity>

  //               <TouchableOpacity
  //                 onPress={() => removeDownload(item.id)}
  //                 className="p-2"
  //               >
  //                 <Ionicons name="trash-outline" size={22} color="#ef4444" />
  //               </TouchableOpacity>
  //             </View>
  //           </View>

  //           {/* Descripción */}
  //           {item.description ? (
  //             <ThemedText className="text-sm mt-3 leading-5" numberOfLines={4}>
  //               {item.description}
  //             </ThemedText>
  //           ) : null}
  //         </View>
  //       );
  //     }}
  //   />
  // );
}
