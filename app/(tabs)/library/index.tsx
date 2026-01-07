import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { useNotificationStore } from "@/presentation/radio-podcast/stores/notifications.store";
import ThemedText from "@/presentation/theme/components/themed-text";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface OptionRowProps {
  icon?: string | ReactNode;
  label: string;
  onPress: () => void;
  iconType?: "Feather" | "Material" | "Ionicons";
}

export default function LibraryScreem() {
  return (
    <View className="flex-1 dark:bg-dark-background bg-light-background">
      <LibraryScreen />
    </View>
  );
}

// Si no usas Expo, asegúrate de tener instalado react-native-vector-icons
// import Icon from 'react-native-vector-icons/Ionicons';

// --- Componente de la Fila de Opción ---
const OptionRow = ({ icon, label, onPress, iconType }: OptionRowProps) => {
  const IconComponent =
    iconType === "Feather"
      ? Feather
      : iconType === "Material"
        ? MaterialCommunityIcons
        : Ionicons;

  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress}>
      <View style={styles.iconContainer}>
        <IconComponent name={icon as any} size={24} color="#e11d48" />
      </View>
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={20} color="#888888" />
    </TouchableOpacity>
  );
};

// --- Componente Principal de la Pantalla ---
export const LibraryScreen = ({ navigation }: any) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const background = useThemeColor({}, "background");

  const userName = user?.fullName || "Usuario";
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Simulación de los datos del usuario (lo reemplazarás con datos reales)
  const userData = {
    name: user?.fullName,
    email: user?.email,
    initials: avatarLetter, // O puedes usar una URL de imagen para el avatar
  };

  return (
    <View className="flex-1 pt-10 px-5 bg-light-background dark:bg-dark-background">
      <ThemedText style={styles.headerTitle}>Biblioteca</ThemedText>

      {/* Sección de Datos del Usuario */}
      <View style={styles.userInfoContainer}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{userData.initials}</ThemedText>
        </View>
        <View>
          <ThemedText style={styles.userName}>{userData.name}</ThemedText>
          <ThemedText style={styles.userEmail}>{userData.email}</ThemedText>
        </View>
      </View>

      <View style={styles.separator} />

      {/* Lista de Opciones */}
      <ScrollView style={styles.optionsList}>
        <OptionRow
          icon="time-outline"
          label="Historial de Reproducción"
          onPress={() => router.push(`/library/history`)}
          iconType="Ionicons"
        />

        <OptionRow
          icon="book-outline"
          label="Audio Libros"
          onPress={() => router.push(`/library/audiobook`)}
          iconType="Ionicons"
        />

        <View style={{ position: "relative" }}>
          <OptionRow
            icon="notifications-outline"
            label="Mis notificaciones"
            onPress={() => router.push("/library/notifications")}
            // iconType="Feather"
          />

          {unreadCount > 0 && (
            <View style={styles.badgeFloating}>
              <ThemedText style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
        {/* <OptionRow
          // icon="notifications-outline"
          icon={unreadCount > 0 ? "notifications" : "notifications-outline"}
          label="Mis notificaciones"
          onPress={() => router.push(`/library/notifications`)}
          iconType="Ionicons"
        /> */}
        <OptionRow
          icon="download-outline"
          label="Descargas"
          onPress={() => router.push("/library/modal/descargas")}
          iconType="Ionicons"
        />
        <OptionRow
          icon="heart-outline"
          label="Me gusta"
          onPress={() => router.push("/favorites")}
          iconType="Ionicons"
        />

        {/* Separador visual para las configuraciones */}
        <View style={{ height: 10 }} />

        <OptionRow
          icon="settings-outline"
          label="Temas"
          onPress={() => router.push("/library/modal/themes")}
          iconType="Ionicons"
        />
        <OptionRow
          icon="help-circle-outline"
          label="Ayuda y Soporte"
          onPress={() => router.push(`/library/modal`)}
          iconType="Ionicons"
        />

        <View style={styles.separator} />

        <OptionRow
          icon="log-out-outline"
          label="Cerrar Sesión"
          onPress={() => logout()}
          iconType="Ionicons"
        />
      </ScrollView>
    </View>
  );
};

// --- Estilos (Styles) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#f7f4f4", // Fondo oscuro profesional
    // backgroundColor: "#121212", // Fondo oscuro profesional
    backgroundColor: Colors.dark.background, // Fondo oscuro profesional
    paddingTop: 50, // Espacio superior para iOS (ajustar con SafeAreaView si es necesario)
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    // color: "#FFFFFF",
    marginBottom: 10,
  },

  // Estilos de la sección de Usuario
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor: "#333333", // Color de fondo del avatar
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#00BFFF", // Borde de acento (ej. Azul brillante)
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    // color: "#FFFFFF",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    // color: "#FFFFFF",
  },
  userEmail: {
    fontSize: 14,
    // color: "#BBBBBB",
  },
  separator: {
    height: 1,
    backgroundColor: "#333333", // Separador sutil
    marginVertical: 10,
  },

  // Estilos de la Lista de Opciones
  optionsList: {
    flex: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 15,
    width: 30, // Asegura alineación consistente de los íconos
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    // color: "#FFFFFF",
  },

  // iconContainer: {
  //     width: 24,
  //   height: 24,
  // },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },

  badgeFloating: {
    position: "absolute",
    top: 5,
    // right: 22,
    left: 10,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
