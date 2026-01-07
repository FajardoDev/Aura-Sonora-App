import {
  // transformHistoryData,
  useHistory,
} from "@/core/radio-podcast/actions/radio-podcast/hooks/useHistory";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import { PopularCategoriesPodcast } from "../podcast/components/PopularCategoriesPodcast ";
import { TopPodcast } from "../podcast/components/TopPodcast";
import { PopularCategoriesStation } from "../radio/components/PopularCategoriesStation";
import { TopStation } from "../radio/components/TopStation";
import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";
import ThemedText from "../theme/components/themed-text";
import HistoryItem from "./HistoryItem";

export default function HomeHistorySection() {
  const { historyQuery, radios, podcasts, isLoading, isError } = useHistory();
  const { streamUrl } = useAudioPlayerStore();

  useFocusEffect(
    useCallback(() => {
      historyQuery.refetch(); //🚀 Esto garantiza que la solicitud se dispare
      return () => {}; // Función de limpieza, aunque no hace falta lógica aquí
    }, [historyQuery.refetch]) // Dependencia simplificada
  );

  if (isLoading) {
    return (
      <View className="flex items-center justify-center py-6">
        <ActivityIndicator size="small" color="#f43f5e" />
      </View>
    );
  }

  if (isError) {
    return (
      <ThemedText className="p-4">Error al cargar el historial.</ThemedText>
    );
  }

  // Si no hay historial y no está cargando, no mostramos la sección
  // if (radios.length === 0 && podcasts.length === 0) {
  // 	return null;
  // }

  return (
    //  <Stack.Screen
    // 	options={{
    // 		title: "Radio Escucha App",
    // 		headerShown: true, // si quieres mostrarlo
    // 	}}
    // />

    <View className="mt-0">
      {/* Radios recientes */}
      {radios.length > 0 && (
        <View className="pt-5">
          <View className="flex-row justify-between items-center">
            <ThemedText className="text-lg font-bold ml-4 mb-1">
              Continuar Escuchando 📻
            </ThemedText>
            <TouchableOpacity>
              <Link
                href={`/library/history`}
                className="text-lg mr-4 mb-1 text-slate-400 font-medium"
              >
                <ThemedText>
                  <Ionicons
                    size={26}
                    name="arrow-forward-outline"
                    color="#f43f5e"
                  />
                </ThemedText>
              </Link>
            </TouchableOpacity>
          </View>
          <FlatList
            data={radios}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <HistoryItem item={item} />}
            contentContainerStyle={{ paddingHorizontal: 1 }}
          />
        </View>
      )}

      {/* Podcasts recientes */}
      {podcasts.length > 0 && (
        <View>
          <View className="flex-row justify-between items-center mt-6">
            <ThemedText className="text-lg font-bold ml-4 mb-1">
              Continuar Escuchando 🎙️
            </ThemedText>
            <TouchableOpacity activeOpacity={0.8}>
              <Link
                href={`/library/history`}
                className="text-lg mr-4 mb-1 text-slate-400 font-medium"
              >
                <ThemedText>
                  <Ionicons
                    size={26}
                    name="arrow-forward-outline"
                    color="#f43f5e"
                  />
                </ThemedText>
              </Link>
            </TouchableOpacity>
          </View>

          {/* <ThemedText className="text-lg font-bold ml-4 mb-1 mt-6">
							Continuar Escuchando 🎙️
						</ThemedText> */}
          <FlatList
            data={podcasts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <HistoryItem item={item} />}
            contentContainerStyle={{ paddingHorizontal: 1 }}
          />
        </View>
      )}

      {/* Top Station */}
      <TopStation />

      <PopularCategoriesStation />
      <TopPodcast />

      {/* <View className={`${isPlaying && "mb-20"} `}> */}
      <View className={`${streamUrl ? "mb-60" : "mb-40"}`}>
        <PopularCategoriesPodcast />
      </View>
    </View>
  );
}
