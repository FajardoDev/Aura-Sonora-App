import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";
import ThemedText from "@/presentation/theme/components/themed-text";

interface UserAvatarProps {
  user?: {
    id: string;
    fullName: string;
    images?: string | null;
    image?: string | null;
  };
  size: number;
  fontSize?: number;
}

export function UserAvatar({ user, size, fontSize = 18 }: UserAvatarProps) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photo = user?.images?.trim() || user?.image?.trim();
  const photoKey = `${user?.id}:${photo}`;
  const initial = Array.from(user?.fullName?.trim() || "Usuario")[0].toLocaleUpperCase();
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (!user) {
    return <Image source={require("../../assets/images/user.png")} style={circle} contentFit="contain" />;
  }

  if (photo && failedPhoto !== photoKey) {
    return <Image key={photoKey} source={{ uri: photo }} style={circle} contentFit="cover"
      onError={() => setFailedPhoto(photoKey)} />;
  }

  return (
    <View style={[circle, { alignItems: "center", justifyContent: "center" }]}>
      <ThemedText style={{ fontSize, fontWeight: "bold" }}>{initial}</ThemedText>
    </View>
  );
}
