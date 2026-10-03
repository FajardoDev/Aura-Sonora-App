import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { NotificationItem, NotificationsResponse } from "../interface/notifications.interface";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  reset: () => void;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [], unreadCount: 0, isLoading: false,
  reset: () => {
    set({ notifications: [], unreadCount: 0, isLoading: false });
    // Remove the old unscoped persisted inbox; personal data stays in memory.
    void AsyncStorage.removeItem("notifications-storage").catch(() => {});
  },
  fetchNotifications: async () => {
    const session = useAuthStore.getState();
    if (session.status !== "authenticated" || !session.user) return;
    const token = session.accessToken;
    set({ isLoading: true });
    try {
      const { data } = await radioPodcastApi.get<NotificationsResponse>("/notifications?page=1&limit=20");
      if (useAuthStore.getState().accessToken !== token) return;
      set({ notifications: data.data, unreadCount: data.meta.unread, isLoading: false });
    } catch {
      if (useAuthStore.getState().accessToken === token) set({ isLoading: false });
    }
  },
  markAllAsRead: async () => {
    const session = useAuthStore.getState();
    if (session.status !== "authenticated" || !session.user) return;
    const token = session.accessToken;
    try {
      await radioPodcastApi.patch("/notifications/read-all");
      if (useAuthStore.getState().accessToken !== token) return;
      set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
    } catch { /* Keep unread state if the server did not acknowledge the update. */ }
  },
}));
