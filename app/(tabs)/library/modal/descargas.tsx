import DownloadedEpisodesList from "@/presentation/podcast/components/DownloadedEpisodesList";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import React from "react";
import { View } from "react-native";

export default function DownloadsScreen() {
  const { streamUrl } = useAudioPlayerStore();

  return (
    // <View className=" ${streamUrl ? "pb-60" : "mb-40"}">
    <View
      className={`flex-1 bg-light-background dark:bg-dark-background  
       
        `}
    >
      <DownloadedEpisodesList />
    </View>
  );
}
