import { fetchPodcastById } from "@/core/radio-podcast/actions/podcast/fetch-podcastBy-id";
import { fetchRadioStationsBySlug } from "@/core/radio-podcast/actions/radio/get-radio-by-slug.action";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import { useAuthNavigation } from "@/presentation/auth/hooks/useAuthNavigation";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, AppState, TouchableOpacity } from "react-native";

interface Props {
  type: "radio" | "podcast" | null;
  slug: string | null;
  visible: boolean;
  beforeLogin: () => void;
}

export function PlayerFavoriteButton({ type, slug, visible, beforeLogin }: Props) {
  const { status, requireAuth } = useAuthNavigation();
  const userId = useAuthStore(state => state.user?.id);
  const pathname = usePathname();
  const client = useQueryClient();
  const enabled = visible && status === "authenticated" && !!slug;
  const radioQuery = useQuery({
    queryKey: ["radioStation", slug], queryFn: () => fetchRadioStationsBySlug(slug!),
    enabled: enabled && type === "radio", staleTime: 0,
  });
  const podcastQuery = useQuery({
    queryKey: ["podcast", slug], queryFn: () => fetchPodcastById(slug!),
    enabled: enabled && type === "podcast", staleTime: 0,
  });
  const { mutate, isPending } = useToggleFavorite();
  const entity = type === "radio" ? radioQuery.data?.data : podcastQuery.data?.podcast;
  const query = type === "radio" ? radioQuery : podcastQuery;
  const refetch = query.refetch;

  // Opening, returning from another route, and account changes refresh the same detail cache.
  useEffect(() => {
    if (!enabled || !type) return;
    void refetch({ cancelRefetch: false });
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void refetch({ cancelRefetch: false });
    });
    return () => subscription.remove();
  }, [enabled, type, slug, userId, pathname, refetch]);

  const handlePress = () => {
    if (status !== "authenticated") {
      beforeLogin();
      requireAuth();
      return;
    }
    if (isPending || query.isFetching) return;
    if (!entity || query.isError) {
      void refetch();
      return;
    }
    const detailKey = [type === "radio" ? "radioStation" : "podcast", slug];
    const previous = client.getQueryData(detailKey);
    mutate(type === "radio"
      ? { type: "radio", radioStationId: entity.id, radioSlug: slug! }
      : { type: "podcast", podcastId: entity.id, podcastSlug: slug! }, {
      onError: () => {
        if (useAuthStore.getState().user?.id !== userId) return;
        if (previous) client.setQueryData(detailKey, previous);
        Alert.alert("Favoritos", "No se pudo actualizar el favorito. Intenta nuevamente.");
      },
    });
  };

  const busy = isPending || (enabled && query.isFetching);
  const selected = status === "authenticated" && !!entity?.isFavorite;
  return <TouchableOpacity onPress={handlePress} disabled={busy} accessibilityRole="button"
    accessibilityLabel={selected ? "Quitar de favoritos" : "Añadir a favoritos"}
    accessibilityState={{ selected, disabled: busy }}
    hitSlop={8} className="bg-white/10 w-11 h-11 items-center justify-center rounded-full border border-white/20">
    {busy ? <ActivityIndicator color="#fb7185" /> : <Ionicons name={selected ? "heart" : "heart-outline"} size={23} color="#fb7185" />}
  </TouchableOpacity>;
}
