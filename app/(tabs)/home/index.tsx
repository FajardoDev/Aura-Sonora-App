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

  // if (!isConnected && downloads.length > 0) {
  //   return (
  //     <View className="flex-1 bg-light-background dark:bg-dark-background mb-36">
  //       <PlayerBackground>
  //         <DownloadedEpisodesList />
  //       </PlayerBackground>
  //     </View>
  //   );
  // }

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
                setInputValue("");
                setDebouncedSearch("");
              }}
            />
          }
          // renderItem={() =>
          //   isSearching ? (
          //     <SearchResults
          //       radios={radios}
          //       podcasts={podcasts}
          //       loading={isLoading}
          //       query={debouncedSearch}
          //     />
          //   ) : (
          //     <HomeHistorySection />
          //   )
          // }

          renderItem={() => {
            if (isOfflineWithDownloads) {
              return (
                <View
                  // className="px-3 pb-32"
                  className={`px-3 ${streamUrl ? "mb-60" : "mb-40"}`}
                >
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
          {value.length > 0 && (
            <TouchableOpacity
              onPress={onClear}
              style={{
                position: "absolute",
                right: 14,
                top: "190%",
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

// export default function HomeScreem() {
//   const { isConnected } = useNetworkStatus();
//   const router = useRouter();

//   const { downloads } = useDownloadsStore();

//   const sections = [
//     // { key: "search", component: <SearchBar /> },
//     { key: "history", component: <HomeHistorySection /> },
//   ];

//   // const { user: users } = useUser();

//   // console.log({ users });

//   const { user } = useAuthStore();

//   const navigation = useNavigation();

//   const { colorScheme } = useColorScheme();
//   const isDark = colorScheme === "dark";

//   const userName = user?.fullName || "Usuario";
//   const avatarLetter = userName.charAt(0).toUpperCase();

//   const uris = require("../../../assets/images/AuraSonoraApp.png");

//   const [inputValue, setInputValue] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState(inputValue);

//   const { podcasts, radios, isLoading, refetchAll } =
//     useGlobalSearch(debouncedSearch);

//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedSearch(inputValue), 300);
//     return () => clearTimeout(handler);
//   }, [inputValue]);

//   useFocusEffect(
//     useCallback(() => {
//       refetchAll();
//       return () => {};
//     }, [refetchAll])
//   );

//   if (isLoading) {
//     return (
//       <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
//         <ActivityIndicator color={"#f43f5e"} />
//         <ThemedText>Buscando contenido... 🔍</ThemedText>
//       </View>
//     );
//   }

//   useEffect(() => {
//     const userImage = user?.images
//       ? { uri: user.images }
//       : require("../../../assets/images/user.png"); // Sin 'uri', directo con require

//     navigation.setOptions({
//       headerLeft: () => (
//         <View className="flex-row items-center ml-4 py-2">
//           <View className="border-2 border-rose-500 rounded-full p-[1px]">
//             <Image
//               source={userImage}
//               style={{ width: 38, height: 38, borderRadius: 19 }}
//             />
//           </View>
//           <View className="ml-3">
//             <ThemedText className="text-[10px] uppercase opacity-60 font-bold dark:text-gray-300">
//               ¡Un gusto escucharte!
//             </ThemedText>
//             <ThemedText className="text-sm font-bold dark:text-white">
//               Hola, {userName || "Usuario"}
//             </ThemedText>
//           </View>
//         </View>
//       ),
//     });
//   }, [user, userName]);

//   // 🧩 Estado inicial (aún cargando estado de red)
//   if (isConnected === null) {
//     return (
//       <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
//         <ActivityIndicator color="#f43f5e" />
//         <ThemedText>Cargando estado de red...</ThemedText>
//       </View>
//     );
//   }

//   // 2️⃣ Sin conexión (modo offline)
//   if (!isConnected && downloads.length === 0) {
//     return (
//       <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background p-4 ">
//         <ThemedText className="text-lg font-semibold">
//           Sin conexión a Internet
//         </ThemedText>
//         <ThemedText className="text-gray-500 text-center my-2">
//           Puedes escuchar tus episodios descargados o reconectarte para ver más
//           contenido.
//         </ThemedText>

//         <Button
//           title="Reintentar"
//           onPress={async () => {
//             const state = await NetInfo.fetch();
//             if (!state.isConnected) {
//               Alert.alert(
//                 "Sin conexión",
//                 "Aún no tienes Internet. Revisa tu red y vuelve a intentarlo."
//               );
//               return;
//             }
//           }}
//         />
//       </View>
//     );
//   }

//   // 💾 Sin conexión pero sí hay descargas
//   if (!isConnected && downloads.length > 0) {
//     return (
//       <View className="flex-1 bg-light-background dark:bg-dark-background">
//         <ThemedText className="text-lg font-bold text-center mb-3">
//           Modo sin conexión
//         </ThemedText>
//         <DownloadedEpisodesList />
//       </View>
//     );
//   }

//   return (
//     <>
//       <Stack.Screen
//         options={{
//           headerShown: true,
//           headerTransparent: true, // Para que el fondo de la app suba hasta la barra de estado
//           headerTitle: "", // Vaciamos el título central para dar aire
//           headerRight: () => (
//             <View className="mr-4">
//               {/* Solo el Isotipo (Icono) a la derecha */}
//               <Image
//                 source={uris} // Usa solo el icono sin letras
//                 style={{ width: 50, height: 50, borderRadius: 25 }}
//                 // resizeMode="contain"
//               />
//             </View>
//           ),
//           headerBackground: () => <PlayerBackground className="rounded-none" />,
//         }}
//       />

//       <View className="flex-1 bg-light-background dark:bg-dark-background">
//         <FlatList
//           data={sections}
//           keyExtractor={(item) => item.key}
//           renderItem={({ item }) => item.component}
//           showsVerticalScrollIndicator={false} // Cabecera que quedará sticky
//           // ListHeaderComponent={<SearchBar />}
//           stickyHeaderIndices={[0]} // Hace "pegajosa" la cabecera (índice 0 => ListHeaderComponent)
//           contentContainerStyle={{
//             flexGrow: 1,
//             // marginTop: 50,
//             paddingBottom: 40,
//             // paddingTop: 90,
//           }}
//         />

//         <View>
//           <View style={{ zIndex: 10 }}>
//             {/* <View className="mx-3 relative mt-4"> */}
//             <View className="h-[130px] justify-center mb-8">
//               <PlayerBackground
//                 style={{
//                   position: "absolute",
//                   top: 0,
//                   left: 0,
//                   right: 0,
//                   bottom: 0,
//                 }}
//                 className="rounded-none"
//               />
//               {/* 🔍 Campo de búsqueda */}
//               <ThemeTextInput
//                 placeholder="Buscar radios & podcasts..."
//                 icon="search-outline"
//                 value={inputValue}
//                 onChangeText={setInputValue}
//                 style={{
//                   height: 46,
//                   // borderRadius: 24,
//                   borderBottomLeftRadius: 12,
//                   borderBottomRightRadius: 12,
//                   paddingHorizontal: 15,
//                   backgroundColor: isDark ? "#1E293B" : "rgba(255,255,255,0.8)",
//                   borderWidth: isDark ? 1 : 1,
//                   borderColor: "#E2E8F0",
//                   zIndex: 20,
//                   // marginHorizontal: 10,
//                 }}
//               />
//               {/* <ThemeTextInput
//           placeholder="Buscar radios & podcasts..."
//           icon="search-outline"
//           value={inputValue}
//           onChangeText={setInputValue}
//           style={{
//             padding: 5,
//             borderWidth: 1,
//             borderRadius: 20,
//             paddingRight: 35,
//             // zIndex: 20,
//           }}
//         /> */}

//               {/* ❌ Botón para limpiar búsqueda */}
//               {inputValue.length > 0 && (
//                 <TouchableOpacity
//                   onPress={() => setInputValue("")}
//                   className="absolute right-6 top-8 -translate-y-1/2"
//                 >
//                   <Ionicons name="close-circle" size={20} color="#9b9898" />
//                 </TouchableOpacity>
//               )}
//             </View>
//           </View>

//           <ScrollView showsVerticalScrollIndicator={false}>
//             {debouncedSearch.trim() !== "" ? (
//               <>
//                 {radios.length > 0 && (
//                   <>
//                     <ThemedText className="text-xl font-bold mx-3 mt-2">
//                       Radios
//                     </ThemedText>
//                     <RadioGrid
//                       emisoras={radios}
//                       loadNextPage={() => {}}
//                       hasNextPage={false}
//                       isSearching={false}
//                     />
//                   </>
//                 )}

//                 {podcasts.length > 0 && (
//                   <>
//                     <ThemedText className="text-xl font-bold mx-3 mt-2">
//                       Podcasts
//                     </ThemedText>
//                     <GridPodcast
//                       podcasts={podcasts}
//                       loadNextPage={() => {}}
//                       hasNextPage={false}
//                       isSearching={false}
//                     />
//                   </>
//                 )}

//                 {radios.length === 0 && podcasts.length === 0 && (
//                   <View className="items-center mb-2">
//                     <ThemedText>
//                       {`No se encontraron resultados para ${debouncedSearch} 😔`}
//                     </ThemedText>
//                   </View>
//                 )}
//               </>
//             ) : (
//               <></>
//             )}
//           </ScrollView>
//         </View>
//       </View>
//     </>
//   );
// }
