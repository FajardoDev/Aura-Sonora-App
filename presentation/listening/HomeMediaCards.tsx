import { mediaCardStyles } from "./media-card-layout";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { getImageUrl } from "@/presentation/podcast/components/PodcastGridItem";

export function RadioLogo({ uri }: { uri?: string }) {
  return <View style={styles.radioLogo}>
    <Image source={uri ? { uri } : require("../../assets/images/radios.png")}
      style={styles.logoImage} contentFit="contain" transition={200} />
  </View>;
}

export function PodcastArtwork({ uri }: { uri?: string }) {
  const image = getImageUrl(uri);
  return <Image source={image ? { uri: image } : require("../../assets/images/podcasts.png")}
    style={mediaCardStyles.artwork} contentFit="cover" transition={200} />;
}

const styles = StyleSheet.create({
  radioLogo: { width: "100%", aspectRatio: 4 / 3, padding: 12, backgroundColor: "#64748b",
    borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  logoImage: { width: "100%", height: "100%" },
});
