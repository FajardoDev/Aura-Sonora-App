// import { radioPodcastApi } from "@/core/api/radioPodcastApi";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import * as Notifications from "expo-notifications";
// import { useEffect } from "react";
// import { NotificationsResponse } from "../interface/notifications.interface";
// import { useNotificationStore } from "../stores/notifications.store";

// export const useNotifications = () => {
//   const queryClient = useQueryClient();
//   const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

//   const notificationsQuery = useQuery({
//     queryKey: ["notifications"],
//     queryFn: async () => {
//       const { data } =
//         await radioPodcastApi.get<NotificationsResponse>("/notifications");
//       return data;
//     },
//     // ✅ PRO: No permitas que React Query refresque solo mientras estás en la pantalla
//     staleTime: Infinity,
//     gcTime: 1000 * 60 * 60, // 1 hora de caché persistente
//   });

//   // ✅ SINCRONIZACIÓN ATÓMICA: DB -> STORE -> OS BADGE
//   // Sincronización inicial
//   useEffect(() => {
//     if (notificationsQuery.data) {
//       setUnreadCount(notificationsQuery.data.meta.unread);
//     }
//   }, [notificationsQuery.data?.meta.unread]);

//   // ✅ Ruta 2: PATCH para marcar una como leída
//   const markAsRead = useMutation({
//     mutationFn: (id: string) =>
//       radioPodcastApi.patch(`/notifications/${id}/read`),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["notifications"] });
//     },
//   });

//   // ✅ Ruta 3: PATCH para marcar TODAS como leídas
//   //   const markAllAsRead = useMutation({
//   //     mutationFn: () => radioPodcastApi.patch("/notifications/read-all"),
//   //     onSuccess: () => {
//   //       console.log("✅ Server actualizado: Todas leídas");
//   //       // Importante: resetear el store local de inmediato para que el banner desaparezca YA
//   //       setUnreadCount(0);
//   //       Notifications.setBadgeCountAsync(0);
//   //       // Refrescar la lista para que cambie la opacidad de los items
//   //       queryClient.invalidateQueries({ queryKey: ["notifications"] });
//   //     },
//   //     onError: (err) => console.error("❌ Error al limpiar:", err),
//   //   });
//   const markAllAsRead = useMutation({
//     mutationFn: () => radioPodcastApi.patch("/notifications/read-all"),
//     onMutate: async () => {
//       // 1. Cancelamos cualquier petición para que no haya guerra de datos
//       await queryClient.cancelQueries({ queryKey: ["notifications"] });
//       const previousData = queryClient.getQueryData<NotificationsResponse>([
//         "notifications",
//       ]);

//       // 2. ⚡ ACTUALIZACIÓN OPTIMISTA: Forzamos la verdad en la UI
//       queryClient.setQueryData<NotificationsResponse>(
//         ["notifications"],
//         (old) => {
//           if (!old) return old;
//           return {
//             ...old,
//             meta: { ...old.meta, unread: 0 },
//             data: old.data.map((item) => ({ ...item, isRead: true })),
//           };
//         }
//       );

//       // 3. Banner a cero YA
//       setUnreadCount(0);
//       Notifications.setBadgeCountAsync(0);

//       return { previousData };
//     },
//     onError: (err, _, context) => {
//       if (context?.previousData) {
//         queryClient.setQueryData(["notifications"], context.previousData);
//         setUnreadCount(context.previousData.meta.unread);
//       }
//     },
//     onSettled: () => {
//       // ⚠️ No invalidamos de golpe para que no parpadee.
//       // Dejamos que el usuario vea su lista limpia.
//     },
//   });

//   return {
//     notifications: notificationsQuery.data?.data ?? [],
//     meta: notificationsQuery.data?.meta,
//     isLoading: notificationsQuery.isLoading,
//     markAsRead: markAsRead.mutate,
//     markAllAsRead: markAllAsRead.mutate,
//     refetch: notificationsQuery.refetch,
//   };
// };

// import { radioPodcastApi } from "@/core/api/radioPodcastApi";
// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import * as Notifications from "expo-notifications";
// import { useEffect } from "react";
// import { NotificationsResponse } from "../interface/notifications.interface";
// import { useNotificationStore } from "../stores/notifications.store";

// export const useNotifications = () => {
//   const queryClient = useQueryClient();
//   const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

//   const notificationsQuery = useQuery({
//     queryKey: ["notifications"],
//     queryFn: async () => {
//       const { data } =
//         await radioPodcastApi.get<NotificationsResponse>("/notifications");
//       return data;
//     },
//   });

//   // ✅ SINCRONIZACIÓN PRO: Cuando el backend responde, actualizamos el Store y el OS
//   useEffect(() => {
//     if (notificationsQuery.data) {
//       const unread = notificationsQuery.data.meta.unread;
//       setUnreadCount(unread);
//       Notifications.setBadgeCountAsync(unread);
//     }
//   }, [notificationsQuery.data]);

//   const markAsReadMutation = useMutation({
//     mutationFn: async (id: string) =>
//       radioPodcastApi.patch(`/notifications/${id}/read`),
//     onSuccess: () =>
//       queryClient.invalidateQueries({ queryKey: ["notifications"] }),
//   });

//   const markAllAsReadMutation = useMutation({
//     mutationFn: async () => radioPodcastApi.post("/notifications/read-all"),
//     onSuccess: () =>
//       queryClient.invalidateQueries({ queryKey: ["notifications"] }),
//   });

//   //   console.log({ markAllAsReadMutation });

//   return {
//     notifications: notificationsQuery.data?.data ?? [],
//     meta: notificationsQuery.data?.meta,
//     isLoading: notificationsQuery.isLoading,
//     markAsRead: markAsReadMutation.mutate,
//     markAllAsRead: markAllAsReadMutation.mutate,
//     refetch: notificationsQuery.refetch,
//   };
// };
