import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

interface RatingStarsProps {
  rating: number; // Calificación promedio
  commentsCount: number; // Cantidad de comentarios
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  commentsCount,
}) => {
  const fullStars = Math.floor(rating); // Estrellas llenas
  const hasHalfStar = rating % 1 >= 0.5; // Media estrella

  return (
    <View className="flex-row items-center">
      {/* Estrellas llenas */}
      {[...Array(fullStars)].map((_, index) => (
        <Ionicons
          key={`full-${index}`}
          name="star"
          size={10}
          color="#facc15" // Amarillo (Tailwind: yellow-400)
          className="mr-0.5"
        />
      ))}

      {/* Media estrella */}
      {hasHalfStar && (
        <Ionicons
          name="star-half"
          size={12}
          color="#facc15"
          className="mr-0.5"
        />
      )}

      {/* Estrellas vacías */}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, index) => (
        <Ionicons
          key={`empty-${index}`}
          name="star-outline"
          size={13}
          color="#facc15"
          className="mr-0.5"
        />
      ))}

      {/* Cantidad de comentarios */}
      <ThemedText className="text-xs text-zinc-400 ml-1">
        ({commentsCount})
      </ThemedText>
    </View>
  );
};
