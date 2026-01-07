import { Platform, Pressable, Switch, View } from "react-native";
import { useThemeColor } from "../hooks/use-theme-color";
import ThemedText from "./themed-text";

interface Props {
  text?: string;
  value: boolean;
  className?: string;

  onValueChange: (value: boolean) => void;
}

const isAndroid = Platform.OS === "android";

export const ThemedSwitch = ({
  onValueChange,
  value,
  className,
  text,
}: Props) => {
  const switchActiveColor = useThemeColor({}, "primary");

  return (
    <Pressable
      className={`flex flex-row mx-2 items-center justify-between mb-5 active:opacity-80 ${className}`}
      onPress={() => onValueChange(!value)}
    >
      {text ? text && <ThemedText type="h2">{text}</ThemedText> : <View />}

      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={isAndroid ? switchActiveColor : ""}
        // ios_backgroundColor={value ? "green" : "red"}
        trackColor={{
          false: "grey",
          true: switchActiveColor,
        }}
      />
    </Pressable>
  );
};
