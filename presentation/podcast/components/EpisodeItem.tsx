// EpisodeItem.tsx
import type { Episode } from "@/core/radio-podcast/interface/podcast/podcast-episodes.interface";
import { useEpisodeDownloads } from "@/presentation/podcast/hooks/useEpisodeDownloads";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { extractDirectAudioLink } from "@/utils/urlEpisodes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { getImageUrl } from "./PodcastGridItem";

interface Props {
  ep: Episode;
  isPlayingGlobalStreamUrl?: string | null;
  onPlay: (ep: Episode) => void;
}

function EpisodeItemCmp({ ep, isPlayingGlobalStreamUrl, onPlay }: Props) {
  const { isDownloaded, download, remove } = useEpisodeDownloads();
  const { streamUrl, isPlaying } = useAudioPlayerStore();

  // estado local del item
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [downloadedUri, setDownloadedUri] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const direct = useMemo(() => extractDirectAudioLink(ep.links), [ep.links]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setChecking(true);
      try {
        const entry = await isDownloaded(ep.id);
        if (!mounted) return;
        setDownloadedUri(entry?.localUri ?? null);
      } catch (e) {
        console.error("isDownloaded check", e);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [ep.id, isDownloaded]);

  const handleDownload = useCallback(async () => {
    if (!direct) return;
    setDownloading(true);
    setProgress(0);
    try {
      const { uri } = await download(
        {
          id: ep.id,
          audioUrl: direct,
          episodeTitle: ep.episodeTitle,
          podcastId: ep.podcast?.id,
          image: ep.image,
        },
        (p) => {
          setProgress(p);
        }
      );
      setDownloadedUri(uri);
    } catch (err) {
      console.error("Download error:", err);
      // mostrar toast o alert si quieres
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  }, [direct, ep, download]);

  const handleDelete = useCallback(async () => {
    try {
      const ok = await remove(ep.id);
      if (ok) {
        setDownloadedUri(null);
      }
    } catch (e) {
      console.error("Delete:", e);
    }
  }, [ep.id, remove]);

  const isCurrent = streamUrl === direct;
  const showAsPlaying = isCurrent && isPlaying;

  return (
    <View
      key={ep.id}
      className="bg-black/5 dark:bg-white/5 rounded-2xl mb-3 p-3 border border-white/10"
    >
      <View className="flex-row items-center justify-between rounded-md">
        <Image
          source={
            ep.image
              ? { uri: getImageUrl(ep.image), cache: "force-cache" }
              : require("../../../assets/images/radio-podcast.jpg")
          }
          style={{ width: 75, height: 75, borderRadius: 15, marginRight: 7 }}
          contentFit="cover"
          transition={500}
          placeholder={require("../../../assets/images/podcasts.png")}
          priority="high"
        />

        <View className="flex-1 mr-3">
          <ThemedText
            numberOfLines={1}
            style={{ color: "#fff", fontWeight: "600" }}
          >
            {ep.episodeTitle}
          </ThemedText>
          <ThemedText numberOfLines={1} style={{ color: "#ccc", fontSize: 12 }}>
            {new Date(ep.episodeDate).toLocaleDateString("es-DO", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </ThemedText>
        </View>

        <View style={{ alignItems: "flex-end", width: 90 }}>
          <TouchableOpacity
            onPress={() => onPlay(ep)}
            style={{ marginBottom: 6 }}
          >
            <Ionicons
              name={showAsPlaying ? "pause-circle" : "play-circle-outline"}
              size={38}
              color="#ef4444"
            />
          </TouchableOpacity>

          {/* Descargar / Progreso / Borrar */}
          {checking ? (
            <ActivityIndicator />
          ) : downloadedUri ? (
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity onPress={handleDelete} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <ThemedText style={{ color: "#9ca3af", fontSize: 11 }}>
                Offline
              </ThemedText>
            </View>
          ) : downloading ? (
            <View style={{ alignItems: "center" }}>
              <ThemedText style={{ color: "#fff", fontSize: 12 }}>
                {progress ?? 0}%
              </ThemedText>
              <ActivityIndicator color="#ef4444" />
            </View>
          ) : (
            <TouchableOpacity onPress={handleDownload} style={{ padding: 6 }}>
              <Ionicons name="download-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ThemedText numberOfLines={4} style={{ color: "#d1d5db", marginTop: 10 }}>
        {ep.episodeDescription}
      </ThemedText>
    </View>
  );
}

export default React.memo(EpisodeItemCmp);
