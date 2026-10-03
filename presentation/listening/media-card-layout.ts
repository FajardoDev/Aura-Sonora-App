import { StyleSheet, useWindowDimensions } from "react-native";

// Top 9 is the reference: three 30% cards with one 5px margin per card.
export const mediaListContentStyle = { paddingHorizontal: 1 };
export const mediaCardStyles = StyleSheet.create({
  card: {
    margin: 5, backgroundColor: "#011016", borderRadius: 12,
    shadowColor: "#000", boxShadow: "2px 2px 5px #011016",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  artwork: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  details: { paddingHorizontal: 4, paddingVertical: 5 },
});
export function useMediaCardWidth(variant: "grid" | "compact") {
  const { width } = useWindowDimensions();
  return variant === "compact" ? (width - 2) * 0.3 : "30%" as const;
}
