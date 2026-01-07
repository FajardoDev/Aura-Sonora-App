import { Ionicons } from "@expo/vector-icons";
import { Pressable, PressableProps, StyleSheet } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";
import ThemedText from "./themed-text";

interface Props extends PressableProps {
  className?: string;
  children: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ThemedButton({
  className,
  children,
  icon,
  ...rest
}: Props) {
  const backgroundColor = useThemeColor({}, "primary");
  // const textColor = useThemeColor({}, "text");

  return (
    <Pressable
      className={`bg-light-primary dark:bg-dark-primary px-5 py-2 mb-7 flex-row items-center justify-center rounded-xl active:opacity-80  ${className}`}
      //  Saber si esta presionado en btn
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? backgroundColor + "90" : backgroundColor,
        },
        styles.botton,
      ]}
      {...rest}
    >
      <ThemedText
        className="text-light-background dark:text-dark-text font-Roboto-SemiBold"
        style={{ color: "white" }}
      >
        {children}
      </ThemedText>

      {icon && (
        <Ionicons
          name={icon}
          size={24}
          // color="#e11d48"
          color="#fdfafa"
          style={{ marginHorizontal: 5 }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botton: {
    width: "100%",
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 7,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
  },
});
