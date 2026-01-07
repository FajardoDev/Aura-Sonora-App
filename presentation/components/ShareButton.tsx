import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Share, TouchableOpacity } from "react-native";

interface ShareProps {
  title: string;
  url: string;
  description?: string;
  className?: string;
}

export const ShareButton = ({
  title,
  url,
  description,
  className,
}: ShareProps) => {
  const handleShare = async () => {
    try {
      const result = await Share.share({
        title,
        message: `${description ? description + "\n" : ""}🎧 Escúchalo aquí: ${url}`,
        url,
      });

      if (result.action === Share.sharedAction) {
        console.log("✅ Compartido exitosamente");
        // Alert.alert('"✅ Compartido exitosamente"');
      }
    } catch (error) {
      console.error("❌ Error al compartir:", error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleShare}
      className="absolute bg-black/70 rounded-full p-1 top-0 left-0 z-20"
    >
      <Ionicons name="share-social-outline" size={15} color="#f43f5e" />
    </TouchableOpacity>
  );
};
