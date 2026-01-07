// import { PlayerBackground } from "@/presentation/components/PlayerBackground";
// import { useGlobalSearch } from "@/presentation/hooks/useGlobalSearch";
// import GridPodcast from "@/presentation/podcast/components/GridPodcast";
// import ThemedText from "@/presentation/theme/components/themed-text";
// import ThemeTextInput from "@/presentation/theme/components/ThemeTextInput";
// import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
// import { Ionicons } from "@expo/vector-icons";
// import { useFocusEffect } from "expo-router";
// import { useColorScheme } from "nativewind";
// import React, { useCallback, useEffect, useState } from "react";
// import { ActivityIndicator, TouchableOpacity, View } from "react-native";
// import { RadioGrid } from "./radioGrid";

// export const SearchBar = () => {
//   const [inputValue, setInputValue] = useState("");
//   const [debouncedSearch, setDebouncedSearch] = useState(inputValue);

//   const background = useThemeColor({}, "background");
//   // BG Linear Gradient
//   const { colorScheme } = useColorScheme();
//   const isDark = colorScheme === "dark";

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

//   return (
//     // <PlayerBackground></PlayerBackground>
//     <View style={{ zIndex: 10 }}>
//       {/* <View className="mx-3 relative mt-4"> */}
//       <View className="h-[130px] justify-center mb-8">
//         <PlayerBackground
//           style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
//           className="rounded-none"
//         />
//         {/* 🔍 Campo de búsqueda */}
//         <ThemeTextInput
//           placeholder="Buscar radios & podcasts..."
//           icon="search-outline"
//           value={inputValue}
//           onChangeText={setInputValue}
//           style={{
//             height: 46,
//             // borderRadius: 24,
//             borderBottomLeftRadius: 12,
//             borderBottomRightRadius: 12,
//             paddingHorizontal: 15,
//             backgroundColor: isDark ? "#1E293B" : "rgba(255,255,255,0.8)",
//             borderWidth: isDark ? 1 : 1,
//             borderColor: "#E2E8F0",
//             zIndex: 20,
//             // marginHorizontal: 10,
//           }}
//         />
//         {/* <ThemeTextInput
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

//         {/* ❌ Botón para limpiar búsqueda */}
//         {inputValue.length > 0 && (
//           <TouchableOpacity
//             onPress={() => setInputValue("")}
//             className="absolute right-6 top-8 -translate-y-1/2"
//           >
//             <Ionicons name="close-circle" size={20} color="#9b9898" />
//           </TouchableOpacity>
//         )}
//       </View>

//     </View>
//   );
// };
