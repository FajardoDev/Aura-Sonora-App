import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";

interface Props extends TextInputProps {
  className?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ThemeTextInput({
  className,
  icon,
  style,
  ...rest
}: Props) {
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "success");

  const [isActive, setIsActive] = useState(false);

  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        {
          ...styles.border,
          borderColor: isActive ? primaryColor : "#ccc",
        },
        style as any,
      ]}
      onTouchStart={() => inputRef.current?.focus()}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={24}
          color={textColor}
          style={{ marginRight: 6, marginLeft: 6 }}
        />
      )}

      <TextInput
        // className="py-4 px-2 text-black dark:text-white"
        ref={inputRef}
        placeholderTextColor="#5c5c5c"
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        style={{
          color: textColor,
          marginRight: 8,
          flex: 1,
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  border: {
    borderWidth: 1,
    borderColor: "#D1D5DB", // border-gray-300
    borderRadius: 6,
    marginBottom: 14,
    // padding: 4,
    flexDirection: "row",
    alignItems: "center",
  },
});
