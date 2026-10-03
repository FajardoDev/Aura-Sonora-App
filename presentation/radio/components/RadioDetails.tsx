import type { Data } from "@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface";
import { ThemedCard } from "@/presentation/theme/components/ThemedCard";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { stationPresentation } from "../utils/stationPresentation";

export default function RadioDetails({ radio }: { radio: Data }) {
  const details = stationPresentation(radio);
  const [expanded, setExpanded] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const information = [
    ["Frecuencia", details.frequency],
    ["Ubicación", details.locations.join(" · ")],
    ["País", details.country],
    ["Categorías", details.categories.join(" · ")],
    ["Idioma", details.language],
  ].filter(([, value]) => value);

  const openContact = async (url: string) => {
    setLinkError(null);
    try { await Linking.openURL(url); }
    catch { setLinkError("No se pudo abrir este contacto en tu dispositivo."); }
  };
  return (
    <View style={{ gap: 16 }}>
      {!!details.description && (
        <ThemedCard className="p-5 rounded-3xl border border-black/5 dark:border-white/10">
          <ThemedText className="text-lg font-Roboto-Bold mb-3">Sobre la emisora</ThemedText>
          <ThemedText className="text-sm leading-6 opacity-80" numberOfLines={expanded || details.description.length <= 280 ? undefined : 6}>
            {details.description}
          </ThemedText>
          {details.description.length > 280 && (
            <Pressable onPress={() => setExpanded(!expanded)} accessibilityRole="button" accessibilityState={{ expanded }} className="pt-3 py-2">
              <ThemedText className="text-rose-500 font-Roboto-SemiBold">{expanded ? "Ver menos" : "Leer más"}</ThemedText>
            </Pressable>
          )}
        </ThemedCard>
      )}
      {information.length > 0 && (
        <ThemedCard className="p-5 rounded-3xl border border-black/5 dark:border-white/10">
          <ThemedText className="text-lg font-Roboto-Bold mb-2">Información</ThemedText>
          {information.map(([label, value]) => (
            <View key={label} className="py-3 border-b border-black/5 dark:border-white/5">
              <ThemedText className="text-xs opacity-60 mb-1">{label}</ThemedText>
              <ThemedText className="text-sm leading-5">{value}</ThemedText>
            </View>
          ))}
        </ThemedCard>
      )}
      {(details.contacts.length > 0 || details.address) && (
        <ThemedCard className="p-5 rounded-3xl border border-black/5 dark:border-white/10">
          <ThemedText className="text-lg font-Roboto-Bold mb-2">Contacto</ThemedText>
          {details.contacts.map(contact => (
            <Pressable key={contact.label} onPress={contact.url ? () => openContact(contact.url!) : undefined}
              disabled={!contact.url} accessibilityRole={contact.url ? "link" : undefined}
              accessibilityLabel={`${contact.label}: ${contact.value}`}
              className="flex-row items-center py-3 border-b border-black/5 dark:border-white/5 active:opacity-60">
              <View className="bg-rose-500/10 p-3 rounded-2xl mr-3">
                <Ionicons name={contact.icon} color="#f43f5e" size={21} />
              </View>
              <View className="flex-1">
                <ThemedText className="text-xs opacity-60 mb-1">{contact.label}</ThemedText>
                <ThemedText className="text-sm leading-5" style={{ flexShrink: 1 }}>{contact.value}</ThemedText>
              </View>
              {contact.url && <Ionicons name="open-outline" color="#f43f5e" size={18} style={{ marginLeft: 8 }} />}
            </Pressable>
          ))}
          {!!details.address && <View className="pt-4"><ThemedText className="text-xs opacity-60 mb-1">Dirección</ThemedText><ThemedText className="text-sm leading-5">{details.address}</ThemedText></View>}
          {linkError && <ThemedText accessibilityRole="alert" className="text-sm text-rose-500 mt-3">{linkError}</ThemedText>}
        </ThemedCard>
      )}
    </View>
  );
}
