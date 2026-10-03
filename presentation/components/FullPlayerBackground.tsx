import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";

// Artwork changes the atmosphere; a fixed surface keeps text and controls legible.
export const FullPlayerBackground = memo(function FullPlayerBackground({
  artwork,
}: { artwork?: string | null }) {
  const [failedArtwork, setFailedArtwork] = useState<string | null>(null);

  return <View pointerEvents="none" accessible={false} style={styles.background}>
    <LinearGradient
      colors={["#011016", "#102239", "#211229"]}
      style={StyleSheet.absoluteFillObject}
    />
    {!!artwork && failedArtwork !== artwork && <Image
      source={{ uri: artwork }}
      style={styles.artwork}
      contentFit="cover"
      blurRadius={20}
      transition={{ duration: 450, effect: "cross-dissolve" }}
      cachePolicy="memory-disk"
      allowDownscaling
      autoplay={false}
      onError={() => setFailedArtwork(artwork)}
    />}
    <LinearGradient
      colors={["rgba(1,16,22,0.80)", "rgba(1,16,22,0.50)", "rgba(1,16,22,0.90)"]}
      locations={[0, 0.4, 1]}
      style={StyleSheet.absoluteFillObject}
    />
  </View>;
});

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: "#011016" },
  artwork: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
});
