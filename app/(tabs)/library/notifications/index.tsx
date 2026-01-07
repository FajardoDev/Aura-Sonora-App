import { useNotificationStore } from "@/presentation/radio-podcast/stores/notifications.store";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import * as Notifications from "expo-notifications"; // ✅ Importante
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";

export default function PushAppNotifications() {
  const { notifications, isLoading, fetchNotifications, markAllAsRead } =
    useNotificationStore();
  const { streamUrl } = useAudioPlayerStore();

  // useEffect(() => {
  //   // Al entrar, pedimos datos frescos, pero el Store protegerá los que ya leímos
  //   fetchNotifications().then(() => markAllAsRead());
  // }, []);

  useEffect(() => {
    const cleanUp = async () => {
      // 1. Cargamos y marcamos en DB/Store
      await fetchNotifications();
      await markAllAsRead();

      // 2. ⚡ ESTO ES LO QUE BORRA LA PANTALLA DE BLOQUEO
      // Borra TODAS las notificaciones del centro de control del celular
      await Notifications.dismissAllNotificationsAsync();

      // 3. Opcional: Pone el badge del icono de la app en 0
      await Notifications.setBadgeCountAsync(0);
    };

    cleanUp();
  }, []);

  // useEffect(() => {
  //   // Al entrar: Cargamos y marcamos como leído de una vez
  //   const init = async () => {
  //     await fetchNotifications();
  //     markAllAsRead();
  //   };
  //   init();
  // }, []);

  // ✅ Limpieza automática del Banner al entrar a la pantalla
  // useEffect(() => {
  //   const fetchAndMark = async () => {
  //     // Si no está cargando y hay notificaciones sin leer, las barremos todas
  //     const hasUnread = notifications.some((n) => !n.isRead);
  //     if (!isLoading && hasUnread) {
  //       console.log("🧹 Limpiando notificaciones en el server...");
  //       await markAllAsRead();
  //     }
  //   };

  //   fetchAndMark();
  // }, [isLoading, notifications.length]); // Se dispara cuando termina de cargar o cambia el número
  // useEffect(() => {
  //   if (notifications.some((n) => !n.isRead)) {
  //     markAllAsRead();
  //   }
  // }, [notifications.length]);

  return (
    <View className="flex-1 bg-light-background dark:bg-dark-background px-4 pt-4">
      <ThemedText className="text-2xl font-black mb-6">
        Notificaciones
      </ThemedText>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchNotifications}
          />
        }
        renderItem={({ item }) => (
          <View
            className={`p-4 mb-3 rounded-xl ${item.isRead ? "opacity-40 bg-gray-200 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800"}`}
          >
            <ThemedText className={item.isRead ? "font-normal" : "font-bold"}>
              {item.title}
            </ThemedText>
            <ThemedText className="text-gray-500">{item.body}</ThemedText>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="mt-20 items-center">
              <ThemedText className="text-gray-400">
                Todo al día por aquí ☕
              </ThemedText>
            </View>
          ) : (
            <ActivityIndicator color="#FF3B30" />
          )
        }
        contentContainerStyle={{ paddingBottom: streamUrl ? 250 : 220 }}
      />
    </View>
  );
}

// import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";
// import { useNotifications } from "@/presentation/radio-podcast/hooks/useNotifications";
// import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
// import ThemedText from "@/presentation/theme/components/themed-text";
// import { ActivityIndicator, FlatList, Pressable, View } from "react-native";

// export default function PushAppNotifications() {
//   const { handleAction } = usePushNotifications();
//   const { notifications, isLoading, refetch, markAsRead, markAllAsRead } =
//     useNotifications();
//   const { streamUrl } = useAudioPlayerStore();

//   return (
//     <View className="flex-1 bg-light-background dark:bg-dark-background px-4 pt-4">
//       <View className="flex-row justify-between items-center mb-6">
//         <ThemedText className="text-2xl font-black">Notificaciones</ThemedText>

//         {notifications.length > 0 && (
//           <Pressable onPress={() => markAllAsRead()}>
//             <ThemedText className="text-primary font-bold text-sm">
//               Limpiar todas
//             </ThemedText>
//           </Pressable>
//         )}
//       </View>

//       <FlatList
//         data={notifications}
//         keyExtractor={(item) => item.id}
//         onRefresh={refetch}
//         refreshing={isLoading}
//         renderItem={({ item }) => {
//           // Verificación de seguridad: si item.isRead es undefined, tratamos como no leída
//           const isRead = item.isRead === true;

//           return (
//             <Pressable
//               onPress={() => {
//                 if (!isRead) markAsRead(item.id);
//                 handleAction(item.data);
//               }}
//               className={`p-4 mb-3 rounded-2xl flex-row items-center ${
//                 isRead
//                   ? "bg-gray-100/30 dark:bg-white/5 opacity-50" // Leída: Opaca y sutil
//                   : "bg-white dark:bg-white/10 border-l-4 border-primary shadow-md" // No leída: Resaltada
//               }`}
//             >
//               <View className="flex-1">
//                 <ThemedText
//                   className={`text-base ${!isRead ? "font-bold" : "font-normal text-gray-400"}`}
//                 >
//                   {item.title}
//                 </ThemedText>
//                 <ThemedText className="text-gray-500 text-sm" numberOfLines={1}>
//                   {item.body}
//                 </ThemedText>
//               </View>

//               {!isRead && (
//                 <View className="w-3 h-3 rounded-full bg-primary animate-pulse ml-2" />
//               )}
//             </Pressable>
//           );
//         }}
//         ListEmptyComponent={
//           !isLoading ? (
//             <View className="mt-20 items-center">
//               <ThemedText className="text-gray-400">
//                 Todo al día por aquí ☕
//               </ThemedText>
//             </View>
//           ) : (
//             <ActivityIndicator color="#FF3B30" />
//           )
//         }
//         contentContainerStyle={{ paddingBottom: streamUrl ? 280 : 100 }}
//       />
//     </View>
//   );
// }

// import { usePushNotifications } from "@/presentation/hooks/usePushNotifications";
// import { useNotificationStore } from "@/presentation/radio-podcast/stores/notifications.store";
// import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
// import ThemedText from "@/presentation/theme/components/themed-text";
// import * as Notifications from "expo-notifications";
// import { useEffect } from "react";
// import { FlatList, View } from "react-native";

// export default function PushAppNotifications() {
//   // const { notifications, expoPushToken } = usePushNotifications();
//   const { notifications } = usePushNotifications();
//   const clearBadge = useNotificationStore((s) => s.clearBadge);
//   const { streamUrl } = useAudioPlayerStore();

//   // const resetBadge = useNotificationStore((s) => s.reset);

//   console.log("Cantidad de notificaciones", notifications.length);
//   // console.log({ expoPushToken });

//   useEffect(() => {
//     clearBadge();
//     Notifications.setBadgeCountAsync(0);
//   }, []);

//   return (
//     <View className="flex-1 bg-light-background dark:bg-dark-background px-3 pt-3">
//       <ThemedText className="text-2xl font-bold mb-5">
//         Mis Notificaciones
//       </ThemedText>

//       <FlatList
//         data={notifications}
//         keyExtractor={(item) => item.request.identifier}
//         showsVerticalScrollIndicator={false}
//         renderItem={({ item }) => (
//           <View className="mb-5">
//             <ThemedText className="text-lg font-bold">
//               {item.request.content.title}
//             </ThemedText>
//             <ThemedText type="normal">{item.request.content.body}</ThemedText>
//             <ThemedText type="normal">
//               {JSON.stringify(item.request.content.data, null, 2)}
//             </ThemedText>
//           </View>
//         )}
//         ItemSeparatorComponent={() => (
//           <View style={{ height: 1, backgroundColor: "grey", opacity: 0.3 }} />
//         )}
//         ListEmptyComponent={
//           <ThemedText className="text-center">
//             No tienes notificaciones aún
//           </ThemedText>
//         }
//         contentContainerStyle={{
//           paddingBottom: streamUrl ? 250 : 220,
//         }}
//       />
//     </View>
//   );
// }
