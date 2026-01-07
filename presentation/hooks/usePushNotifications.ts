import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useNotificationStore } from "../radio-podcast/stores/notifications.store";

// 🔥 CRÍTICO: Esto permite que el celular MUESTRE el banner aunque la app esté abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// export const usePushNotifications = () => {
//   const router = useRouter();
//   const pathname = usePathname();
//   const queryClient = useQueryClient();
//   const [token, setToken] = useState<string | undefined>(undefined);

//   const notificationListener = useRef<Notifications.EventSubscription | null>(
//     null
//   );
//   const responseListener = useRef<Notifications.EventSubscription | null>(null);

//   // ✅ PRO: Referencia para evitar ejecuciones duplicadas del Cold Start
//   const isColdStartHandled = useRef(false);

//   useEffect(() => {
//     registerForPushNotificationsAsync().then((t) => setToken(t));

//     // ✅ PRO: Cuando llega una push, invalidamos la cache para traer la lista real de la DB
//     notificationListener.current =
//       Notifications.addNotificationReceivedListener(() => {
//         queryClient.invalidateQueries({ queryKey: ["notifications"] });
//       });

//     responseListener.current =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         handleAction(response.notification.request.content.data);
//       });

//     // ✅ MANEJO DE COLD START (App cerrada)
//     Notifications.getLastNotificationResponseAsync().then((response) => {
//       // Solo ejecutamos si hay respuesta Y si no la hemos procesado ya en esta sesión
//       if (response && !isColdStartHandled.current) {
//         isColdStartHandled.current = true; // Marcamos como procesada
//         handleAction(response.notification.request.content.data);
//       }
//     });

//     return () => {
//       notificationListener.current?.remove();
//       responseListener.current?.remove();
//     };
//   }, []);

//   useEffect(() => {
//     if (!token) return;
//     radioPodcastApi
//       .post("/notifications/register-token", { token, platform: Platform.OS })
//       .catch((err) => console.error("❌ Error backend token:", err));
//   }, [token]);

//   const handleAction = (data: any) => {
//     if (!data || pathname === "/library/notifications") return;

//     // Al hacer tap, el backend debería marcarla como leída, invalidamos para refrescar
//     queryClient.invalidateQueries({ queryKey: ["notifications"] });

//     setTimeout(() => {
//       if (data.type === "podcast") {
//         router.push(`/podcast/${data.podcastSlug}?episode=${data.episodeId}`);
//       } else if (data.type === "radio") {
//         router.push(`/radio-station/${data.slug}`);
//       }
//     }, 250);
//   };

//   return { token, handleAction }; // ✅ AHORA EXPORTADO
// };

export const usePushNotifications = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | undefined>(undefined);

  // ✅ Traemos la acción de Zustand para refrescar datos
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const isColdStartHandled = useRef(false);

  useEffect(() => {
    registerForPushNotificationsAsync().then((t) => setToken(t));

    // ✅ CUANDO LLEGA: Si llega una notificación con la app abierta,
    // ejecutamos el fetch de Zustand para que el banner suba.
    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {
        fetchNotifications();
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleAction(response.notification.request.content.data);
      });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && !isColdStartHandled.current) {
        isColdStartHandled.current = true;
        handleAction(response.notification.request.content.data);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    radioPodcastApi
      .post("/notifications/register-token", { token, platform: Platform.OS })
      .catch((err) => console.error("❌ Error backend token:", err));
  }, [token]);

  const handleAction = (data: any) => {
    if (!data) return;

    // ✅ Al interactuar, refrescamos el store para estar al día
    fetchNotifications();

    if (pathname === "/library/notifications") return;

    setTimeout(() => {
      if (data.type === "podcast") {
        router.push(`/podcast/${data.podcastSlug}?episode=${data.episodeId}`);
      } else if (data.type === "radio") {
        router.push(`/radio-station/${data.slug}`);
      }
    }, 250);
  };

  return { token, handleAction };
};

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  }
  return token;
}

// import { radioPodcastApi } from "@/core/api/radioPodcastApi";
// import Constants from "expo-constants";
// import * as Device from "expo-device";
// import * as Notifications from "expo-notifications";
// import { usePathname, useRouter } from "expo-router";
// import { useEffect, useRef, useState } from "react";
// import { Platform } from "react-native";
// import { useNotificationStore } from "../radio-podcast/stores/notifications.store";

// // 🔥 CRÍTICO: Esto permite que el celular MUESTRE el banner aunque la app esté abierta
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// export const usePushNotifications = () => {
//   const router = useRouter();
//   const pathname = usePathname();

//   const addNotification = useNotificationStore((s) => s.addNotification);
//   const clearBadge = useNotificationStore((s) => s.clearBadge); // <-- Importamos la acción de limpiar

//   const notificationListener = useRef<Notifications.EventSubscription | null>(
//     null
//   );
//   const [token, setToken] = useState<string | undefined>(undefined);

//   const responseListener = useRef<Notifications.EventSubscription | null>(null);

//   useEffect(() => {
//     // 1. Pedir permisos y obtener Token
//     registerForPushNotificationsAsync().then((t) => setToken(t));

//     // 2. Listener: Recepción con app abierta
//     notificationListener.current =
//       Notifications.addNotificationReceivedListener((notification) => {
//         addNotification(notification);
//       });

//     // 3. Listener: Tap del usuario
//     responseListener.current =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         handleAction(response.notification.request.content.data);
//       });

//     // Cold Start
//     Notifications.getLastNotificationResponseAsync().then((response) => {
//       if (response) handleAction(response.notification.request.content.data);
//     });

//     return () => {
//       notificationListener.current?.remove();
//       responseListener.current?.remove();
//     };
//   }, []);

//   // ✅ REGISTRO EN BACKEND (Integrado y limpio)
//   useEffect(() => {
//     if (!token) return;

//     const syncToken = async () => {
//       try {
//         await radioPodcastApi.post("/notifications/register-token", {
//           token: token,
//           platform: Platform.OS,
//         });
//         console.log("✅ Token sincronizado con backend");
//       } catch (error) {
//         console.error("❌ Error backend token:", error);
//       }
//     };
//     syncToken();
//   }, [token]);

//   const handleAction = (data: any) => {
//     if (!data || pathname === "/library/notifications") return;

//     clearBadge();

//     setTimeout(() => {
//       if (data.type === "podcast") {
//         router.push(`/podcast/${data.podcastSlug}?episode=${data.episodeId}`);
//       } else if (data.type === "radio") {
//         router.push(`/radio-station/${data.slug}`);
//       }
//     }, 200);
//   };

//   return { notifications: useNotificationStore((s) => s.notifications) };
// };

// // --- FUNCIÓN DE PERMISOS (Indispensable para que lleguen al celular) ---
// async function registerForPushNotificationsAsync() {
//   let token;
//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "default",
//       importance: Notifications.AndroidImportance.MAX,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: "#FF231F7C",
//     });
//   }

//   if (Device.isDevice) {
//     const { status: existingStatus } =
//       await Notifications.getPermissionsAsync();
//     let finalStatus = existingStatus;
//     if (existingStatus !== "granted") {
//       const { status } = await Notifications.requestPermissionsAsync();
//       finalStatus = status;
//     }
//     if (finalStatus !== "granted") return;

//     const projectId =
//       Constants?.expoConfig?.extra?.eas?.projectId ??
//       Constants?.easConfig?.projectId;
//     token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
//   }
//   return token;
// }

/*
import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useLastNotificationResponse } from "expo-notifications";
// import { router } from "expo-router";
import { usePathname, useRootNavigationState, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useNotificationStore } from "../radio-podcast/stores/notifications.store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface SendPushOptions {
  to: string[];
  title: string;
  body: string;
  data: Record<string, any>;
}

// Para mi backend
async function sendPushNotification(options: SendPushOptions) {
  const { body, data, title, to } = options;

  const message = {
    to: to,
    sound: "default",
    title: title,
    body: body,
    data: data,
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      // IMPORTANTE preguntar a user si quiere resivir notificaciones push

      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permiso no concedido para obtener token de inserción para notificaciones de inserción!"
      );
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log({ [Platform.OS]: pushTokenString });
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError(
      "Debe utilizar un dispositivo físico para las notificaciones automáticas."
    );
  }
}

// let areListenersReady: boolean = false;

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notifications, setNotifications] = useState<
    Notifications.Notification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0); //Separar notificaciones de no leídas


  const router = useRouter();
  const navigationState = useRootNavigationState();
  const lastNotificationResponse = useLastNotificationResponse();
  const pathname = usePathname();

  console.log(pathname);

  const incrementBadge = useNotificationStore((s) => s.increment);

  const [pendingNavigation, setPendingNavigation] = useState<{
    type: string;
    podcastSlug?: string;
    episodeId?: string;
    slug?: string;
  } | null>(null);

  //   Una notificación solo debe navegar UNA VEZ Después debe considerarse consumida
  const [navigationSource, setNavigationSource] = useState<
    "push" | "internal" | null
  >(null);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ""))
      .catch((error: any) => setExpoPushToken(`${error}`));
  }, []);

  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);

		setUnreadCount((count) => count + 1);
        incrementBadge();

        Notifications.setBadgeCountAsync(
          useNotificationStore.getState().unreadCount + 1
        );
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        setNavigationSource("push");
        setPendingNavigation(data as any);
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // --- COLD START: si la app estaba cerrada y se abrió desde una notificación ---
  useEffect(() => {
    if (!lastNotificationResponse) return;

    const data = lastNotificationResponse.notification.request.content
      .data as any;

    if (!data) return;

    setNavigationSource("push");
    setPendingNavigation(data);
  }, [lastNotificationResponse]);

  useEffect(() => {
    if (!expoPushToken) return;

    const registerTokenInBackend = async () => {
      try {
        await radioPodcastApi.post("/notifications/register-token", {
          token: expoPushToken,
          platform: Platform.OS,
        });

        console.log("✅ Push token registrado en backend");
      } catch (error) {
        console.warn("❌ Error registrando push token", error);
      }
    };

    registerTokenInBackend();
  }, [expoPushToken]);

  useEffect(() => {
    if (!navigationState?.key) return; // ⛔ Router no listo
    if (!pendingNavigation) return; // ⛔ Nada que navegar

    // ⛔ NO navegar si el usuario está viendo la lista de notificaciones
    if (pathname === "/library/notifications") {
      return;
    }

    // ⛔ Si NO viene de push, NO navegamos
    if (navigationSource !== "push") {
      setPendingNavigation(null);
      return;
    }

    if (
      pendingNavigation.type === "podcast" &&
      pendingNavigation.podcastSlug &&
      pendingNavigation.episodeId
    ) {
      router.push(
        `/podcast/${pendingNavigation.podcastSlug}?episode=${pendingNavigation.episodeId}`
      );
    }

    if (pendingNavigation.type === "radio" && pendingNavigation.slug) {
      router.push(`/radio-station/${pendingNavigation.slug}`);
    }

    // 🔥 CONSUMIMOS la notificación
    setPendingNavigation(null); // 🔥 Importantísimo
    setNavigationSource(null);
  }, [navigationState, pendingNavigation, navigationSource]);

  console.log(notifications);

  return {
    //    Properties
    expoPushToken,
    notifications,

    // Methods
    sendPushNotification,
  };
};
* */

/*
import { radioPodcastApi } from "@/core/api/radioPodcastApi";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let areListenersReady = false;

export const usePushNotifications = () => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notifications, setNotifications] = useState<
    Notifications.Notification[]
  >([]);

  // 1) Obtener token al inicio
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ""))
      .catch((err) => setExpoPushToken(`${err}`));
  }, []);

  // 2) Instalar listeners (received + response) y evitar doble registro
  useEffect(() => {
    if (areListenersReady) return;
    areListenersReady = true;

    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as any;
        if (!data) return;

        // manejo de deep link solo cuando viene de la notificación del sistema
        if (data.type === "podcast" && data.podcastSlug && data.episodeId) {
          router.push(`/podcast/${data.podcastSlug}?episode=${data.episodeId}`);
          return;
        }

        if (data.type === "radio" && data.slug) {
          router.push(`/radio-station/${data.slug}`);
          return;
        }

        // fallback (opcional)
        // router.push('/');
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [router]);

  // 3) Cold start: si la app fue abierta desde una notificación (la API correcta)
  useEffect(() => {
    (async () => {
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (!lastResponse) return;
      const data = lastResponse.notification.request.content.data as any;
      if (!data) return;
      if (data.type === "podcast" && data.podcastSlug && data.episodeId) {
        // replace para no apilar rutas
        router.replace(
          `/podcast/${data.podcastSlug}?episode=${data.episodeId}`
        );
      }
    })();
  }, [router]);

  // 4) Registrar token en backend (solo mobile)
  useEffect(() => {
    if (!expoPushToken) return;
    if (Platform.OS === "web") return;

    const registerTokenInBackend = async () => {
      try {
        await radioPodcastApi.post("/notifications/register-token", {
          token: expoPushToken,
          platform: Platform.OS,
        });
        console.log("✅ Push token registrado en backend");
      } catch (error) {
        console.warn("❌ Error registrando push token", error);
      }
    };

    registerTokenInBackend();
  }, [expoPushToken]);

  return {
    expoPushToken,
    notifications,
    sendPushNotification: sendPushNotification,
  };
};

// --- funciones auxiliares (mantén las tuyas si quieres) ---
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (!Device.isDevice) {
    throw new Error(
      "Debe utilizar un dispositivo físico para las notificaciones automáticas."
    );
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    throw new Error("Permiso no concedido para notificaciones push");
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) throw new Error("Project ID not found");

  const pushTokenString = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;
  console.log({ expoPushToken: pushTokenString });
  return pushTokenString;
}

async function sendPushNotification(options: {
  to: string[];
  title: string;
  body: string;
  data: Record<string, any>;
}) {
  const { to, title, body, data } = options;
  const message = { to, sound: "default", title, body, data };
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
* */
