// Banner

import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  NotificationItem,
  NotificationsResponse,
} from "../interface/notifications.interface";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      fetchNotifications: async () => {
        set({ isLoading: true });
        try {
          const { data } = await radioPodcastApi.get<NotificationsResponse>(
            "/notifications?page=1&limit=20"
          );

          // ✅ LÓGICA PRO: Si en nuestro estado local ya marcamos como leída una notificación,
          // no dejamos que el servidor la "reviva" como no leída.
          const localNotifications = get().notifications;

          const mergedNotifications = data.data.map((serverItem) => {
            const localItem = localNotifications.find(
              (l) => l.id === serverItem.id
            );
            return localItem?.isRead
              ? { ...serverItem, isRead: true }
              : serverItem;
          });

          // Recalculamos el unread basado en nuestra realidad local
          const realUnreadCount = mergedNotifications.filter(
            (n) => !n.isRead
          ).length;

          set({
            notifications: mergedNotifications,
            unreadCount: realUnreadCount,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      markAllAsRead: async () => {
        // 1. Cambiamos la realidad en el teléfono al instante
        set({
          notifications: get().notifications.map((n) => ({
            ...n,
            isRead: true,
          })),
          unreadCount: 0,
        });

        try {
          // 2. Avisamos al servidor. Si falla, no importa, el teléfono ya lo "sabe"
          await radioPodcastApi.patch("/notifications/read-all");
        } catch (e) {
          console.log("Servidor lento, pero la UI ya está limpia");
        }
      },
    }),
    {
      name: "notifications-storage", // Nombre de la llave en el storage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// import { create } from "zustand";

// interface NotificationState {
//   unreadCount: number;
//   setUnreadCount: (count: number) => void;
// }

// export const useNotificationStore = create<NotificationState>((set) => ({
//   unreadCount: 0,
//   setUnreadCount: (count) => set({ unreadCount: count }),
// }));

// @/presentation/radio-podcast/stores/notifications.store.ts
// import * as Notifications from "expo-notifications";
// import { create } from "zustand";

// interface NotificationState {
//   notifications: Notifications.Notification[];
//   unreadCount: number;
//   addNotification: (n: Notifications.Notification) => void;
//   clearBadge: () => void;
// }

// export const useNotificationStore = create<NotificationState>((set, get) => ({
//   notifications: [],
//   unreadCount: 0,

//   addNotification: (n) => {
//     // Evitamos duplicados por ID
//     const exists = get().notifications.some(
//       (notif) => notif.request.identifier === n.request.identifier
//     );
//     if (exists) return;

//     set((state) => ({
//       notifications: [n, ...state.notifications],
//       unreadCount: state.unreadCount + 1,
//     }));

//     // Sincroniza el ícono de la app inmediatamente
//     Notifications.setBadgeCountAsync(get().unreadCount);
//   },

//   clearBadge: () => {
//     set({ unreadCount: 0 });
//     Notifications.setBadgeCountAsync(0);
//   },
// }));
