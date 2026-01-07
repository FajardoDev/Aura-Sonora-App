import { Link, LinkProps } from "expo-router";
import { useThemeColor } from "../hooks/use-theme-color";

interface Props extends LinkProps {}

export default function ThemedLink({ style, ...rest }: Props) {
  const primaryColor = useThemeColor({}, "primary");

  return (
    <Link
      style={[
        {
          color: primaryColor,
        },
        style,
      ]}
      {...rest}
    />
  );
}
