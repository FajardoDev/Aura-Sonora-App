/* eslint-disable react-hooks/exhaustive-deps */
import { Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import { RadioGrid } from "@/presentation/radio/components/radioGrid";
import { useRadioStation } from "@/presentation/radio/hooks/useRadioStation";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  TouchableOpacity,
  View,
} from "react-native";

export default function RadioScreen() {
  // Para la busqueda
  // 1. Estado para el input: Cambia inmediatamente para una UX fluida
  const [inputValue, setInputValue] = useState("");
  // const [isOffline, setIsOffline] = useState(false);
  const { isConnected } = useNetworkStatus();

  const [debouncedSearch, setDebouncedSearch] = useState(inputValue);
  const router = useRouter();

  const { slug } = useLocalSearchParams();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // useEffect(() => {
  // 	const checkConnection = async () => {
  // 		const state = await Network.getNetworkStateAsync();
  // 		setIsOffline(!state.isConnected);
  // 	};
  // 	checkConnection();
  // }, []);

  // 🚀 Solo redirige si hay slug y no estás ya en esa ruta
  useEffect(() => {
    if (slug) {
      router.replace(`/radio-station/${slug}`);
    }
  }, [slug]);

  // 2. Estado DEBOUNCED: Retrasamos el valor 300ms para no sobrecargar el servidor
  // const debouncedSearchTerm = useDebounce(inputValue, 300);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(inputValue), 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const { radioStationQuery, loadNextPage, hasNextPage } =
    useRadioStation(debouncedSearch);

  // useEffect(() => {
  // 	checkStatus();
  // }, []);

  // if (radioStationQuery.isLoading && !radioStationQuery.isFetching) {
  // 	// Solo loader inicial
  // 	return (
  // 		<View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
  // 			<ActivityIndicator color={"#f43f5e"} />
  // 			<ThemedText>Cargando estaciones... 📻</ThemedText>
  // 		</View>
  // 	);
  // }

  if (isConnected === null || radioStationQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color={"#f43f5e"} />
        <ThemedText>Cargando estaciones... 📻</ThemedText>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold">
          Sin conexión a Internet
        </ThemedText>
        <ThemedText className="text-gray-500 text-center my-2">
          Puedes escuchar tus episodios descargados o reconectarte para ver más
          contenido.
        </ThemedText>

        <Button
          title="Reintentar"
          onPress={async () => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              Alert.alert(
                "Sin conexión",
                "Aún no tienes Internet. Revisa tu red y vuelve a intentarlo."
              );
              return;
            }
            radioStationQuery.refetch(); // solo si realmente hay conexión
          }}
        />
        {/* <Button title="Reintentar" onPress={() => setIsOffline(false)} /> */}
      </View>
    );
  }

  // if (radioStationQuery.isError) {
  // 	const isNetworkError = radioStationQuery.error?.message?.includes(
  // 		"Network request failed",
  // 	);

  // 	return (
  // 		<View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background p-4">
  // 			<ThemedText className="text-lg font-semibold">
  // 				{isNetworkError
  // 					? "Sin conexión a Internet"
  // 					: "No se pudieron cargar las Emisoras"}
  // 			</ThemedText>
  // 			<ThemedText className="text-gray-500 text-center mt-2">
  // 				{isNetworkError
  // 					? "Revisa tu conexión o abre tus descargados sin conexión."
  // 					: "Ocurrió un error inesperado, intenta de nuevo."}
  // 			</ThemedText>
  // 		</View>
  // 	);
  // }

  if (radioStationQuery.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ThemedText className="text-lg font-semibold">
          No se pudieron cargar las Emisoras 🎧
        </ThemedText>
        <ThemedText className="text-gray-500 text-center mt-2">
          Ocurrió un error inesperado, intenta de nuevo.
        </ThemedText>
      </View>
    );
  }

  const allStations: Station[] =
    radioStationQuery.data?.pages.flatMap(
      (page) => page.stations // <-- Accede a 'stations' dentro de cada 'page'
    ) ?? [];

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background mt-0">
      <View className="">
        <PlayerBackground style={{ position: "absolute", inset: 0 }} />

        {/* <View className="relative mx-3">
         
          <ThemeTextInput
            placeholder="Busca emisoras..."
            icon="radio-outline"
            value={inputValue}
            onChangeText={setInputValue} // Permanece reactivo
            style={{ padding: 5, borderWidth: 1, paddingRight: 35 }}
          />

          {inputValue.length > 0 && (
            <TouchableOpacity
              onPress={() => setInputValue("")}
              className="absolute right-3 top-7 -translate-y-1/2"
            >
              <Ionicons name="close-circle" size={20} color="#9b9898" />
            </TouchableOpacity>
          )}
        </View> */}

        {/* Contenedor relativo del buscador */}
        <View className="mx-3 relative">
          <ThemeTextInput
            placeholder="Busca emisoras..."
            icon="radio-outline"
            value={inputValue}
            onChangeText={setInputValue} // Permanece reactivo
            style={{
              height: 48,
              paddingLeft: 42, // espacio para icono search
              paddingRight: 42, // espacio para el ❌
              borderRadius: 14,
              backgroundColor: isDark ? "#1E293B" : "rgba(255,255,255,0.95)",
              borderWidth: isDark ? 0 : 1,
              borderColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          />

          {/* ❌ Limpiar búsqueda (alineado perfectamente) */}
          {inputValue.length > 0 && (
            <TouchableOpacity
              onPress={() => setInputValue("")}
              style={{
                position: "absolute",
                right: 14,
                top: "40%",
                zIndex: 100,
                transform: [{ translateY: -10 }],
              }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? "#94A3B8" : "#9CA3AF"}
              />
            </TouchableOpacity>
          )}
        </View>

        {radioStationQuery.isLoading && !radioStationQuery.isFetching && (
          <>
            <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
              {" "}
              <ActivityIndicator color={"#f43f5e"} />{" "}
              <ThemedText>Buscando... 📻</ThemedText>{" "}
            </View>
          </>
        )}

        {/* ⚠️ Sin resultados */}
        {!radioStationQuery.isFetching && allStations.length === 0 && (
          <View style={{ margin: 20, alignItems: "center" }}>
            <ThemedText className="text-center">
              No hay resultados para: {inputValue} 😔
            </ThemedText>
          </View>
        )}

        <RadioGrid
          emisoras={allStations}
          loadNextPage={loadNextPage}
          hasNextPage={hasNextPage}
          isSearching={radioStationQuery.isFetchingNextPage}
        />
      </View>
    </View>
  );

  //  return (
  //   /* 1. Usamos PlayerBackground como contenedor principal para que el gradiente cubra todo */
  //   <PlayerBackground style={{ flex: 1 }}>
  //     {/* Agregamos un View con mt-3 para mantener tu espaciado original */}
  //     <View className="flex-1 mt-3">
  //       <View className="relative mx-3">
  //         {/* Busqueda */}
  //         <ThemeTextInput
  //           placeholder="Busca emisoras..."
  //           icon="radio-outline"
  //           value={inputValue}
  //           onChangeText={setInputValue}
  //           // Nota: quitamos el fondo del TextInput si quieres que sea translúcido
  //           // o lo dejamos con su estilo para que resalte sobre el gradiente
  //           style={{ padding: 5, borderWidth: 1, paddingRight: 35 }}
  //         />

  //         {inputValue.length > 0 && (
  //           <TouchableOpacity
  //             onPress={() => setInputValue("")}
  //             className="absolute right-3 top-7 -translate-y-1/2"
  //           >
  //             <Ionicons name="close-circle" size={20} color="#9b9898" />
  //           </TouchableOpacity>
  //         )}
  //       </View>

  //       {/* 2. Loading State (quitamos bg-background para ver el gradiente) */}
  //       {radioStationQuery.isLoading && !radioStationQuery.isFetching && (
  //         <View className="flex-1 items-center justify-center">
  //           <ActivityIndicator color={"#f43f5e"} />
  //           <ThemedText>Buscando... 📻</ThemedText>
  //         </View>
  //       )}

  //       {/* 3. Sin resultados */}
  //       {!radioStationQuery.isFetching && allStations.length === 0 && (
  //         <View style={{ margin: 20, alignItems: "center" }}>
  //           <ThemedText className="text-center">
  //             No hay resultados para: {inputValue} 😔
  //           </ThemedText>
  //         </View>
  //       )}

  //       {/* 4. Lista de resultados */}
  //       <RadioGrid
  //         emisoras={allStations}
  //         loadNextPage={loadNextPage}
  //         hasNextPage={hasNextPage}
  //         isSearching={radioStationQuery.isFetchingNextPage}
  //       />
  //     </View>
  //   </PlayerBackground>
  // );
}
