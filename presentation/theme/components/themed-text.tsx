import { Text, TextProps } from "react-native";

type TextType = "normal" | "h1" | "h2" | "semi-bold" | "link";

// import { useThemeColor } from '@/hooks/use-theme-color';

interface Props extends TextProps {
  className?: string;
  type?: TextType;
}

export default function ThemedText({ className, type, ...rest }: Props) {
  return (
    <Text
      className={[
        "text-light-text dark:text-dark-text",
        type === "normal" ? "font-Roboto-Medium" : undefined,
        type === "h1" ? "text-2xl font-Roboto-ExtraBold" : undefined,
        type === "h2" ? "text-2xl font-Roboto-Bold" : undefined,
        type === "semi-bold" ? "font-Roboto-SemiBold text-xl" : undefined,
        type === "link" ? "font-Roboto-Medium underline" : undefined,
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

// export type ThemedTextProps = TextProps & {
// 	lightColor?: string;
// 	darkColor?: string;
// 	type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
// 	className?: string;
// };

// export function ThemedText({
// 	style,
// 	lightColor,
// 	darkColor,
// 	className,
// 	type = "default",
// 	...rest
// }: ThemedTextProps) {
// 	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

// 	return (
// 		<Text
// 			style={[
// 				{ color },
// 				type === "default" ? styles.default : undefined,
// 				type === "title" ? styles.title : undefined,
// 				type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
// 				type === "subtitle" ? styles.subtitle : undefined,
// 				type === "link" ? styles.link : undefined,
// 				style,
// 			]}
// 			className={className} // <--- ¡AQUÍ ESTÁ EL CAMBIO! Pasas el className
// 			{...rest}
// 		/>
// 	);
// }

// const styles = StyleSheet.create({
// 	default: {
// 		fontSize: 16,
// 		lineHeight: 24,
// 	},
// 	defaultSemiBold: {
// 		fontSize: 16,
// 		lineHeight: 24,
// 		fontWeight: "600",
// 	},
// 	title: {
// 		fontSize: 32,
// 		fontWeight: "bold",
// 		lineHeight: 32,
// 	},
// 	subtitle: {
// 		fontSize: 20,
// 		fontWeight: "bold",
// 	},
// 	link: {
// 		lineHeight: 30,
// 		fontSize: 16,
// 		color: "#0a7ea4",
// 	},
// });
