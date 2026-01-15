import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useTheme } from "@/presentation/context/ThemeChangerContext";
import { useGlobalSearch } from "@/presentation/hooks/useGlobalSearch";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import DownloadedEpisodesList from "@/presentation/podcast/components/DownloadedEpisodesList";
import GridPodcast from "@/presentation/podcast/components/GridPodcast";
import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
import HomeHistorySection from "@/presentation/radio-podcast/HomeHistorySection";
import { RadioGrid } from "@/presentation/radio/components/radioGrid";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { Image } from "expo-image";
import { Stack, useFocusEffect, useNavigation } from "expo-router";
// import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Keyboard,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/* =====================================================
   HOME SCREEN
===================================================== */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { isConnected } = useNetworkStatus();
  const { downloads } = useDownloadsStore();
  const { streamUrl } = useAudioPlayerStore();
  const { user } = useAuthStore();

  // const { colorScheme } = useColorScheme();
  // const isDark = colorScheme === "dark";

  const { resolvedTheme, bgColor } = useTheme();
  const isDark = resolvedTheme === "dark";

  const insets = useSafeAreaInsets();

  /* ==========================
     SEARCH STATE
  ========================== */
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const isSearching = debouncedSearch.trim().length > 0;

  const { radios, podcasts, isLoading, refetchAll } =
    useGlobalSearch(debouncedSearch);

  /* ==========================
     DEBOUNCE
  ========================== */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(inputValue.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [inputValue]);

  useFocusEffect(
    useCallback(() => {
      if (isSearching) refetchAll();
    }, [isSearching, refetchAll])
  );

  /* ==========================
     HEADER LEFT (USER)
  ========================== */
  useEffect(() => {
    const avatar = user?.images
      ? { uri: user.images }
      : require("../../../assets/images/user.png");

    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center ml-4 py-2">
          <View className="border-2 border-rose-500 rounded-full p-[1px]">
            <Image
              source={avatar}
              style={{ width: 38, height: 38, borderRadius: 19 }}
            />
          </View>

          <View className="ml-3">
            <ThemedText className="text-[10px] uppercase opacity-60 font-bold">
              ¡Un gusto escucharte!
            </ThemedText>
            <ThemedText className="text-sm font-bold">
              Hola, {user?.fullName || "Usuario"}
            </ThemedText>
          </View>
        </View>
      ),
    });
  }, [user, navigation]);

  /* ==========================
     NETWORK STATES
  ========================== */
  if (isConnected === null) {
    return (
      // <ScreenWrapper>

      <Centered>
        <ActivityIndicator color="#f43f5e" />
        <ThemedText>Cargando estado de red…</ThemedText>
      </Centered>
      // {/* </ScreenWrapper> */}
    );
  }

  if (!isConnected && downloads.length === 0) {
    return (
      // <ScreenWrapper>

      <Centered>
        <ThemedText className="text-lg font-semibold">
          Sin conexión a Internet
        </ThemedText>
        <ThemedText className="opacity-60 text-center my-2">
          Revisa tu conexión para ver contenido nuevo
        </ThemedText>
        <Button
          title="Reintentar"
          onPress={async () => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              Alert.alert("Sin conexión", "Aún no hay Internet");
            }
          }}
        />
      </Centered>
      // {/* </ScreenWrapper> */}
    );
  }

  const isOfflineWithDownloads = !isConnected && downloads.length > 0;

  /* ==========================
     FLATLIST DATA
  ========================== */
  const data = useMemo(
    () => [{ key: isSearching ? "search" : "home" }],
    [isSearching]
  );

  /* ==========================
     RENDER
  ========================== */
  return (
    <>
      {/* ---------- STACK HEADER ---------- */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => (
            <View className="mr-4">
              <Image
                source={require("../../../assets/images/AuraSonoraApp.png")}
                style={{ width: 54, height: 54, borderRadius: 27 }}
              />
            </View>
          ),
          headerBackground: () => <PlayerBackground className="rounded-none" />,
        }}
      />

      {/* ---------- CONTENT ---------- */}
      {/* <View className="flex-1 bg-light-background dark:bg-dark-background"> */}
      <ScreenWrapper>
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          ListHeaderComponent={
            <SearchHeader
              value={inputValue}
              isDark={isDark}
              onChange={setInputValue}
              onClear={() => {
                Keyboard.dismiss(); // 1. Cierra el teclado de inmediato (libera hilos de la UI)
                setInputValue(""); // 2. Limpia el input visual
                setDebouncedSearch(""); // 3. Limpia la búsqueda
              }}
              // onClear={() => {
              //   setInputValue("");
              //   setDebouncedSearch("");
              // }}
            />
          }
          renderItem={() => {
            if (isOfflineWithDownloads) {
              return (
                <View className={`px-3 ${streamUrl ? "mb-60" : "mb-40"}`}>
                  <ThemedText className="text-xl font-bold mt-4 mb-2">
                    Descargas sin conexión
                  </ThemedText>
                  <DownloadedEpisodesList />
                </View>
              );
            }

            if (isSearching) {
              return (
                <SearchResults
                  radios={radios}
                  podcasts={podcasts}
                  loading={isLoading}
                  query={debouncedSearch}
                />
              );
            }

            return <HomeHistorySection />;
          }}
        />
      </ScreenWrapper>
      {/* </View> */}
    </>
  );
}

/* =====================================================
   SUBCOMPONENTS h-[135px] justify-center 
===================================================== */

function SearchHeader({ value, onChange, onClear, isDark }: any) {
  return (
    <PlayerBackground>
      <View className="mb-1">
        {/* <PlayerBackground style={{ position: "absolute", inset: 0 }} /> */}

        {/* Contenedor relativo del buscador */}
        <View className="mx-4 relative pt-24">
          <ThemeTextInput
            placeholder="Buscar radios & podcasts..."
            icon="search-outline"
            value={value}
            onChangeText={onChange}
            style={{
              height: 48,
              paddingLeft: 42, // espacio para icono search
              paddingRight: 45, // espacio para el ❌
              // paddingRight: 42, // espacio para el ❌
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
          {value.length > 0 && (
            <TouchableOpacity
              // 1. Aumentamos el área táctil (aunque el icono sea pequeño)
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              onPress={onClear}
              style={{
                position: "absolute",
                // right: 14,
                right: 12,
                // top: 24 + 48 / 2 + 12, // pt-24 + (mitad del height) + ajuste manual
                top: "190%",
                zIndex: 100,
                transform: [{ translateY: -10 }],
              }}
            >
              <Ionicons
                name="close-circle"
                size={22}
                color={isDark ? "#94A3B8" : "#9CA3AF"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </PlayerBackground>
  );
}

function SearchResults({ radios, podcasts, loading, query }: any) {
  if (loading) {
    return (
      <Centered>
        <ActivityIndicator color="#f43f5e" />
        <ThemedText>Buscando contenido…</ThemedText>
      </Centered>
    );
  }

  if (!radios.length && !podcasts.length) {
    return (
      <Centered>
        <ThemedText>No se encontraron resultados para “{query}”</ThemedText>
      </Centered>
    );
  }

  return (
    <View className="pb-8">
      {radios.length > 0 && (
        <>
          <ThemedText className="text-xl font-bold mx-3 mt-4">
            Radios
          </ThemedText>
          <RadioGrid
            emisoras={radios}
            loadNextPage={() => {}}
            hasNextPage={false}
            isSearching={false}
          />
        </>
      )}

      {podcasts.length > 0 && (
        <>
          <ThemedText className="text-xl font-bold mx-3 mt-4">
            Podcasts
          </ThemedText>
          <GridPodcast
            podcasts={podcasts}
            loadNextPage={() => {}}
            hasNextPage={false}
            isSearching={false}
          />
        </>
      )}
    </View>
  );
}

function Centered({ children }: any) {
  return (
    <View className="flex-1 items-center justify-center px-6 bg-light-background dark:bg-dark-background">
      {children}
    </View>
  );
}

function ScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView
      style={{ flex: 1 }}
      edges={["top", "left", "right"]}
      className="bg-light-background dark:bg-dark-background"
    >
      {children}
    </SafeAreaView>
  );
}
