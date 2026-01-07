/* eslint-disable react/display-name */
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

interface Props {
  comment: any;
  currentUserId?: string;
  onUpdate: (id: string, content: string, rating: number) => void;
  onDelete: (id: string) => void;
  isLast?: boolean; // ✅ nuevo prop opcional
}

const ComentarioItem: React.FC<Props> = memo(
  ({ comment, currentUserId, onUpdate, onDelete, isLast }) => {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(comment.content);
    const [rating, setRating] = useState(comment.rating);
    const [hover, setHover] = useState<number | null>(null);

    const isOwner = comment.userId === currentUserId;
    const userName = comment.user?.fullName || "Usuario";
    const avatarLetter = userName.charAt(0).toUpperCase();

    const handleSave = (e: any) => {
      e.preventDefault();
      if (!content.trim() || rating === 0) return;
      onUpdate(comment.id, content.trim(), rating);
      setEditing(false);
    };

    return (
      <KeyboardAvoidingView
        id="comments"
        className="border-b border-gray-800 py-3"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
      >
        {/* 🧍 Avatar + Nombre */}
        <View className="flex-row items-center mb-1">
          {comment.user?.image ? (
            <Image
              source={{ uri: comment.user.image }}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <View className="w-8 h-8 rounded-full bg-gray-600 mr-2 items-center justify-center">
              <ThemedText className="font-bold">{avatarLetter}</ThemedText>
            </View>
          )}
          <ThemedText className="font-semibold">{userName}</ThemedText>
        </View>

        {/* ✏️ Si está editando */}
        {editing ? (
          <View className="mt-2">
            {/* 🔹 Estrellas de rating */}
            <View className="flex-row items-center mb-2">
              {[...Array(5)].map((_, i) => {
                const value = i + 1;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setRating(value)}
                    onHoverIn={() => setHover(value)}
                    onHoverOut={() => setHover(null)}
                  >
                    <Ionicons
                      name={
                        value <= (hover ?? rating) ? "star" : "star-outline"
                      }
                      size={22}
                      color={value <= (hover ?? rating) ? "#FACC15" : "#9CA3AF"}
                      style={{ marginRight: 4 }}
                    />
                  </Pressable>
                );
              })}
              <ThemedText className="text-gray-400 text-xs ml-2">
                {rating > 0 ? `${rating}/5` : "Evalúa"}
              </ThemedText>
            </View>

            {/* 🔹 Caja texto */}
            <TextInput
              className={`rounded-md text-gray-700 dark:text-dark-text px-2 mx-1 py-1 min-h-[40px ] ${
                !content.trim()
                  ? "border border-red-500"
                  : "border border-green-500"
              }`}
              autoFocus
              value={content}
              onChangeText={setContent}
              multiline
              // ✅ Agregamos ajustes para mejor comportamiento con teclado
              // blurOnSubmit={false}
              submitBehavior="submit"
              returnKeyType="done"
              // className="border border-gray-600 rounded-md text-white px-2 py-1 min-h-[60px]"
            />

            {/* 🔹 Botones */}
            <View className="flex-row gap-3 mt-2 mx-1">
              <Pressable
                onPress={handleSave}
                className={`px-3 py-1 rounded-md ${
                  !content.trim() || rating === 0
                    ? "bg-gray-700"
                    : "bg-rose-500 active:bg-rose-600"
                }`}
                disabled={!content.trim() || rating === 0}
              >
                <ThemedText className="text-white text-sm">Guardar</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setEditing(false);
                  setContent(comment.content);
                  setRating(comment.rating);
                }}
              >
                <ThemedText className="text-gray-400 text-sm">
                  Cancelar
                </ThemedText>
              </Pressable>
            </View>
            {/* ✅ Solo se muestra si es el último comentario */}
            {isLast && <View className="mb-40" />}
          </View>
        ) : (
          <>
            <ThemedText className="text-sm mb-1">{comment.content}</ThemedText>

            <View className="flex-row items-center">
              {/* ⭐ Mostrar estrellas dinámicas según el rating */}
              {[...Array(comment.rating)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={14}
                  color="#FACC15"
                  style={{ marginRight: 2 }}
                />
              ))}

              {/* 🔸 Fecha del comentario */}
              <ThemedText className="text-gray-500 text-xs ml-1">
                {new Date(comment.createdAt).toLocaleDateString()}
                {/* {comment.rating}/5 {new Date(comment.createdAt).toLocaleDateString()} */}
              </ThemedText>
            </View>
          </>
        )}

        {/* ✏️ Mostrar acciones solo si es el dueño y no está editando */}
        {isOwner && !editing && (
          <View className="flex-row gap-3 mt-2">
            <Pressable onPress={() => setEditing(true)}>
              <ThemedText className="text-blue-400 text-xs bg-indigo-600/30 py-1 px-3 rounded-md">
                Editar
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => onDelete(comment.id)}>
              <ThemedText className="text-rose-400 text-xs">
                Eliminar
              </ThemedText>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  }
);

export default ComentarioItem;

/*
return (
			<View className="border-b border-gray-800 py-3">
				<View className="flex-row items-center mb-1">
					{comment.user?.image ? (
						<Image
							source={{ uri: comment.user.image }}
							className="w-8 h-8 rounded-full mr-2"
						/>
					) : (
						<View className="w-8 h-8 rounded-full bg-gray-600 mr-2 items-center justify-center">
							<Text className="text-white font-bold">{avatarLetter}</Text>
						</View>
					)}
					<Text className="text-white font-semibold">{userName}</Text>
				</View>

				{editing ? (
					<>
						<TextInput
							value={content}
							onChangeText={setContent}
							className="border border-gray-600 rounded-md text-white px-2 py-1 mt-1 mb-2"
							multiline
						/>
						<Pressable
							onPress={() => {
								onUpdate(comment.id, content, rating);
								setEditing(false);
							}}
							className="bg-rose-500 px-3 py-1 rounded-md"
						>
							<Text className="text-white text-sm">Guardar</Text>
						</Pressable>
					</>
				) : (
					<>
						<Text className="text-gray-300 text-sm mb-1">{comment.content}</Text>
						<Text className="text-gray-500 text-xs">
							⭐ {comment.rating} ·{" "}
							{new Date(comment.createdAt).toLocaleDateString()}
						</Text>
					</>
				)}

				{isOwner && !editing && (
					<View className="flex-row gap-3 mt-2">
						<Pressable onPress={() => setEditing(true)}>
							<Text className="text-blue-400 text-xs">Editar</Text>
						</Pressable>
						<Pressable onPress={() => onDelete(comment.id)}>
							<Text className="text-rose-400 text-xs">Eliminar</Text>
						</Pressable>
					</View>
				)}
			</View>
		);

* */
