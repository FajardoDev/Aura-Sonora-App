import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { PlayerBackground } from "@/presentation/components/PlayerBackground";
import { useTheme } from "@/presentation/context/ThemeChangerContext";
import { useGlobalSearch } from "@/presentation/hooks/useGlobalSearch";
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import DownloadedEpisodesList from "@/presentation/podcast/components/DownloadedEpisodesList";
import { buildSearchRows, GlobalSearchResultRow, SearchRow } from "@/presentation/components/GlobalSearchResults";
import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
import HomeHistorySection from "@/presentation/radio-podcast/HomeHistorySection";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { UserAvatar } from "@/presentation/components/UserAvatar";
import { Stack, useNavigation } from "expo-router";
// import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
} from "react-native-safe-area-context";

/* =====================================================
   HOME SCREEN
===================================================== */
export default function HomeScreen() {
  const navigation = useNavigation();
  const { isConnected } = useNetworkStatus();
  const { downloads } = useDownloadsStore();
  const streamUrl = useAudioPlayerStore(state => state.streamUrl);
  const { user } = useAuthStore();

  // const { colorScheme } = useColorScheme();
  // const isDark = colorScheme === "dark";

  const { resolvedTheme, bgColor } = useTheme();
  const isDark = resolvedTheme === "dark";


  /* ==========================
     SEARCH STATE
  ========================== */
  const [inputValue, setInputValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const isSearching = inputValue.trim().length > 0;
  const isDebouncing = inputValue.trim() !== debouncedSearch;

  const search = useGlobalSearch(debouncedSearch);

  /* ==========================
     DEBOUNCE
  ========================== */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(inputValue.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [inputValue]);

  /* ==========================
     HEADER LEFT (USER)
  ========================== */
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View className="flex-row items-center ml-4 py-2">
          <LinearGradient
            colors={["#f43f5e", "#a855f7", "#00BFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 44, height: 44, borderRadius: 22, padding: 2 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, padding: 1, backgroundColor: bgColor }}>
              <UserAvatar user={user} size={38} />
            </View>
          </LinearGradient>

          <View className="ml-3">
            <ThemedText className="text-[10px] uppercase opacity-60 font-bold">
              ¡Un gusto escucharte!
            </ThemedText>
            <ThemedText className="text-sm font-bold">
              Hola, {user?.fullName || "Invitado"}
            </ThemedText>
          </View>
        </View>
      ),
    });
  }, [user, navigation, bgColor]);

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
  type HomeRow = SearchRow | { key: string; kind: "home" };
  const data: HomeRow[] = isSearching && !isOfflineWithDownloads
    ? buildSearchRows(search, isDebouncing)
    : [{ key: "home", kind: "home" }];

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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: isSearching ? (streamUrl ? 300 : 110) : 10 }}
          ListHeaderComponent={
            <SearchHeader
              value={inputValue}
              isDark={isDark}
              onChange={setInputValue}
              onClear={() => {
                setInputValue("");
                setDebouncedSearch("");
              }}
            />
          }
          renderItem={({ item }) => {
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

            if (item.kind !== "home") {
              return <GlobalSearchResultRow row={item} query={debouncedSearch}
                onRetry={media => { void (media === "radio" ? search.radioStationQuery.refetch() : search.podcastQuery.refetch()); }} />;
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
        <View className="mx-4 pt-24">
          <View style={{ position: "relative", height: 48, marginBottom: 14 }}>
          <ThemeTextInput
            placeholder="Buscar radios & podcasts..."
            icon="search-outline"
            value={value}
            onChangeText={onChange}
            style={{
              height: 48,
              marginBottom: 0,
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
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              onPress={onClear}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              style={{
                position: "absolute",
                right: 12,
                top: 0,
                bottom: 0,
                width: 40,
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
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
      </View>
    </PlayerBackground>
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
