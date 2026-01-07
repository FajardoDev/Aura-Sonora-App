import ThemedText from "@/presentation/theme/components/themed-text";
import { Link } from "expo-router";
import { Pressable, TouchableOpacity, View } from "react-native";

interface Props {
  radio: any;
}

export default function RadioDetails({ radio }: Props) {
  return (
    <View>
      <ThemedText className="text-rose-500 mb-2 mt-3 font-Roboto-SemiBold">
        🎵 En vivo ahora
      </ThemedText>
      <ThemedText className="text-sm mb-1 max-w-[50%]">
        📍 {radio?.locations.join(", ")}
      </ThemedText>
      <View className="flex-row flex-wrap mt-2 font-Roboto-Medium">
        {radio?.categories?.map((cat: string, index: number) => (
          <Link key={index} href={`/radio-station/categoria/${cat}`} asChild>
            <TouchableOpacity
              className="dark:bg-white/10 bg-light-icon/5 rounded-full px-3 py-1 mr-2 mb-2 shadow-black shadow-2xl"
              // style={({ pressed }) => ({
              //   opacity: pressed ? 0.4 : 1,
              // })}
            >
              <ThemedText className="text-xs font-medium">{cat}</ThemedText>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
      {/* <Text className="text-gray-300 text-sm mb-1  max-w-[50%]">
				🎺 {radio?.categories.join(", ")}
			</Text> */}

      {/* 🔹 Sitio web */}
      <Pressable onPress={() => console.log("Abrir web")}>
        <View className="flex-row">
          {radio?.contact_info?.website && (
            <>
              <ThemedText className="text-gray-300 text-sm mr-2 font-Roboto-SemiBold mt-2">
                Sitio Web:
              </ThemedText>
              {radio?.contact_info?.website && (
                <View className="flex gap-1 mt-1">
                  <Link href={radio?.contact_info.website}>
                    <ThemedText className="block text-blue-400">
                      🌐 {radio?.contact_info.website}
                    </ThemedText>
                  </Link>
                </View>
              )}
            </>
          )}
        </View>
      </Pressable>

      {/* Descripción */}
      <ThemedText className="text-sm leading-6 mt-3">
        {radio?.description}
      </ThemedText>

      <View>
        {(radio?.contact_info?.facebook ||
          radio?.contact_info?.twitter ||
          radio?.contact_info?.phone ||
          radio?.contact_info?.email) && (
          <View className="">
            <View className="">
              <ThemedText className="mt-2 mb-1 text-xl">Contactos</ThemedText>

              {radio?.contact_info?.facebook && (
                <View className="flex gap-1 ">
                  <Pressable>
                    <ThemedText className="block">
                      {radio?.contact_info.facebook}
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {radio?.contact_info?.twitter && (
                <View className="flex gap-1">
                  <Pressable>
                    <ThemedText className="block text-blue-400">
                      {radio?.contact_info.twitter}
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {(radio?.contact_info?.phone || radio?.contact_info?.email) && (
          <View>
            {/* <Text className="mt-2 mb-1 text-xl text-slate-300">Contactos</Text> */}
            <View>
              {radio?.contact_info?.phone && (
                <ThemedText className="block text-blue-400 ">
                  {radio?.contact_info.phone}
                </ThemedText>
              )}

              {radio?.contact_info?.email && (
                <ThemedText className="block text-blue-400 ">
                  {radio?.contact_info.email}
                </ThemedText>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
