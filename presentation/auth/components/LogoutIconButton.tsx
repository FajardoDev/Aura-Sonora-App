import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { useAuthStore } from "../store/useAuthStore";

export default function LogoutIconButton() {
  // const primaryColor = useThemeColor({}, "primary");

  const { logout } = useAuthStore();

  return (
    <TouchableOpacity className="flex items-end mr-" onPress={logout}>
      <Ionicons name="log-out-outline" color="#f43f5e" size={24} />
    </TouchableOpacity>
  );
}
