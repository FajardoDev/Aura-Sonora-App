/* eslint-disable react/display-name */
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
} from "react-native";

interface Props {
  // onSubmit: (comment: string, rating: number) => Promise<void>;
  onSubmit: (content: string, rating: number) => void;
}

const ComentariosForm: React.FC<Props> = memo(({ onSubmit }) => {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!comment.trim() || rating === 0) return;
    try {
      setLoading(true);
      await onSubmit(comment, rating);
      setComment("");
      setRating(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      // bg-[#111]
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} //Ajusta este valor según sea necesario
      className="p-4 rounded-2xl mb-3 shadow-sm border border-gray-600"
    >
      {/* 🔹 Rating */}
      <ThemedView className="flex-row items-center mb-3">
        {[...Array(5)].map((_, index) => {
          const value = index + 1;
          return (
            <Pressable
              key={value}
              onPress={() => setRating(value)}
              onHoverIn={() => setHover(value)}
              onHoverOut={() => setHover(null)}
            >
              <Ionicons
                name={value <= (hover ?? rating) ? "star" : "star-outline"}
                size={20}
                color={value <= (hover ?? rating) ? "#FACC15" : "#9CA3AF"}
                style={{ marginRight: 6 }}
              />
            </Pressable>
          );
        })}
        <ThemedText className="text-sm ml-2">
          {rating > 0 ? `${rating}/5` : "Ponga su evaluación"}
        </ThemedText>
      </ThemedView>

      {/* 🔹 Caja de texto */}
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Escribe tu opinión..."
        placeholderTextColor="#888"
        multiline
        className="border text-gray-700 dark:text-dark-text border-gray-700 px-3 py-2 rounded-xl mb-3 min-h-[50px]"
      />

      {/* 🔹 Botón enviar */}
      <Pressable
        onPress={handleSend}
        disabled={loading || !comment || rating === 0}
        className={`py-2 rounded-xl ${
          loading || !comment || rating === 0
            ? "bg-gray-500"
            : "bg-indigo-600/50 active:bg-rose-700"
        }`}
      >
        <ThemedText className="text-center font-semibold">
          {loading ? (
            <ThemedText>Publicando...</ThemedText>
          ) : (
            <ThemedText>Publicar comentario</ThemedText>
          )}
        </ThemedText>
      </Pressable>
    </KeyboardAvoidingView>
  );
});

export default ComentariosForm;
