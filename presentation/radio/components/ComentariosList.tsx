/* eslint-disable react/display-name */
import { LastComment } from "@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useQueryClient } from "@tanstack/react-query";
import React, { memo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import ComentarioItem from "./ComentarioItem";

interface Props {
  comments: LastComment[];
  onUpdate: (id: string, content: string, rating: number) => void;
  onDelete: (id: string) => void;
  currentUserId?: string;
  loadNextPage: () => void;
  type: "radio" | "podcast"; // Para el QueryKey
  entityId: string; // Para el QueryKey
  isFetchingNextPage: boolean; // Para el Loader
  hasNextPage: boolean; // Para evitar llamadas innecesarias
}

const ComentariosList: React.FC<Props> = memo(
  ({
    comments,
    onUpdate,
    onDelete,
    currentUserId,
    loadNextPage,
    type,
    entityId,
    isFetchingNextPage,
    hasNextPage,
  }) => {
    const { streamUrl } = useAudioPlayerStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const queryClient = useQueryClient();

    const queryKey = ["comments", type, entityId];

    // fn para cuando retorna despues de cargar borrar cache
    const onPullToRefresh = async () => {
      setIsRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      queryClient.invalidateQueries({
        queryKey: queryKey,
      });

      setIsRefreshing(false);
    };

    // 💡 RENDERIZADO DEL FOOTER
    const renderFooter = () => {
      // Muestra el loader solo si hay más páginas y estamos cargando la siguiente
      if (isFetchingNextPage) {
        return (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="small" color="#f43f5e" />
          </View>
        );
      }

      // Si no hay más páginas y hay contenido, mostrar mensaje de fin
      if (!hasNextPage && comments.length > 0) {
        return (
          <ThemedText className="py-5 text-center text-gray-500 dark:text-gray-400 text-sm mb-5">
            — Fin de los comentarios —
          </ThemedText>
        );
      }
      return null;
    };

    const handleEndReached = () => {
      // Solo intenta cargar si hay más páginas y no está ya cargando
      if (hasNextPage && !isFetchingNextPage) {
        loadNextPage();
      }
    };

    return (
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ComentarioItem
            comment={item}
            currentUserId={currentUserId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isLast={index === comments.length - 1} // ✅ <--- lo agregas aquí
          />
        )}
        // Al 80% de la screen empieza a cargar
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.8}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFooter} // <-- Loader de paginación
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onPullToRefresh}
          />
        }
        ListEmptyComponent={() => (
          <>
            <ThemedText className="text-gray-400 text-center mt-3 mb-10">
              No hay comentarios aún.
            </ThemedText>
          </>
        )}
        contentContainerStyle={{
          paddingHorizontal: 0,
          paddingBottom: streamUrl ? 100 : 100,
        }}
        scrollEnabled={false}
        nestedScrollEnabled
      />
    );
  }
);

export default ComentariosList;
