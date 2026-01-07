/* eslint-disable react-hooks/exhaustive-deps */
import { useNetworkStatus } from "@/presentation/hooks/useNetworkStatus";
import Comentarios from "@/presentation/radio/components/Comentarios";
import RadioDetails from "@/presentation/radio/components/RadioDetails";
import RadioHorizontalList from "@/presentation/radio/components/RadioHorizontalList";
import { useRadioStationBySlug } from "@/presentation/radio/hooks/useRadioStationBySlug";
import { useAudioPlayerStore } from "@/presentation/radio/store/useAudioPlayerStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import {
  Redirect,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

export default function DetallesSlugScreenEmisoras() {
  // params & nav
  const { slug } = useLocalSearchParams();

  const { isConnected } = useNetworkStatus();

  const prevSlugRef = useRef(slug);

  // const prevSlugRefs = useRef<any>(null);

  const isTransitioning = useRef(false);

  // audio global
  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();

  // local
  const [activated, setActivated] = useState(false);

  // data fetch
  const { radioStationBySlugQuery } = useRadioStationBySlug(`${slug}`);

  // stable radio data reference
  const radioData = radioStationBySlugQuery.data?.data ?? undefined;

  useFocusEffect(
    useCallback(() => {
      radioStationBySlugQuery.refetch(); //🚀 Esto garantiza que la solicitud se dispare
      return () => {}; // Función de limpieza, aunque no hace falta lógica aquí
    }, [radioStationBySlugQuery.refetch]) // Dependencia simplificada
  );

  useEffect(() => {
    if (prevSlugRef.current !== slug) return;
    // ✅ El slug cambió realmente
    radioStationBySlugQuery.refetch?.();
    setActivated(false);
    prevSlugRef.current = slug;
  }, [slug]);

  useEffect(() => {
    setActivated(false);
  }, [slug]); // 👈 cada vez que cambie de slug, reinicia activación

  // Determine si la emisora mostrada en el slug es la que se está reproduciendo
  const isCurrentStation = radioData ? streamUrl === radioData.stream : false;

  // Si el stream global cambia y ya no es la emisora de este detalle, resetear activated
  useEffect(() => {
    if (!radioData) return;
    // Si el stream global ya no es el de este detalle, quitar activated
    if (streamUrl !== radioData.stream && activated) {
      setActivated(false);
    }
  }, [streamUrl, radioData?.stream, activated, radioData, slug]);

  // Play / Pause handler (defensivo)
  const handlePlayClick = async () => {
    if (isTransitioning.current) return; // 🚫 evita trigger durante replace

    try {
      if (!radioData) return;

      // Si la emisora actual (en store) es esta → toggle
      if (streamUrl === radioData.stream) {
        togglePlay();
        // marcar activada, así se muestra el icono si no estaba
        setActivated(true);
        return;
      }

      // Si es otra emisora, cambiamos el stream (store se encarga de isPlaying = true)
      setStream(
        radioData.stream,
        radioData.radioname,
        radioData.radioimg,
        radioData.slug,
        radioData.radioid,
        radioData.description,
        radioData.isFavorite,
        "radio" //!MODIFIQUEE
      );

      // marcar activada localmente hasta que streamUrl refleje el cambio
      setActivated(true);
    } catch (err) {
      console.error("handlePlayClick error:", err);
    }
  };

  // Loading UI
  if (isConnected === null || radioStationBySlugQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-light-background dark:bg-dark-background">
        <ActivityIndicator color={"#f43f5e"} />
        <ThemedText>Cargando la radio... 📻</ThemedText>
      </View>
    );
  }

  // 2️⃣ Sin conexión (modo offline)
  if (!isConnected) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ThemedText className="text-lg font-semibold">
          Sin conexión a Internet
        </ThemedText>
        <ThemedText className="text-gray-500 text-center my-2">
          Puedes escuchar tus episodios descargados o reconectarte para ver más
          contenido.
        </ThemedText>

        <Button
          title="Reintentar"
          onPress={async () => {
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              Alert.alert(
                "Sin conexión",
                "Aún no tienes Internet. Revisa tu red y vuelve a intentarlo."
              );
              return;
            }
            radioStationBySlugQuery.refetch(); // solo si realmente hay conexión
          }}
        />
      </View>
    );
  }

  // No data -> redirect safe
  if (!radioData) {
    return <Redirect href="/radio-station" />;
  }

  const radio = radioData;

  // show icon only when this is the current station OR user activated it on this page
  const shouldShowButton = isCurrentStation || activated;

  // const navigation = useNavigation();

  return (
    <>
      <Stack.Screen
        options={{
          title: radioData?.radioname ?? "Detalles de la emisora",
          headerShown: true, // si quieres mostrarlo
        }}
      />

      <ScrollView className="flex-1">
        {/* Imagen con fondo degradado y blur suave */}
        <View className="relative">
          <ImageBackground
            source={{ uri: radio?.radioimg }}
            resizeMode="cover"
            imageStyle={{
              borderBottomLeftRadius: 30,
              borderBottomRightRadius: 30,
            }}
            style={{
              width: "100%",
              height: 250,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}
            blurRadius={10} // 🔥 Fondo desenfocado suave
          >
            {/* Degradado sutil oscuro para contraste */}
            <LinearGradient
              colors={["#00000090", "#00000060", "#00000000"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
              }}
            />

            {/* Imagen principal (más nítida sobre el fondo) */}
            <View className="px-5 pb-8">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePlayClick}
                className="items-center"
              >
                <View
                  style={{
                    width: 160,
                    height: 100,
                    borderRadius: 10,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 6,
                  }}
                >
                  <ImageBackground
                    source={{ uri: radio?.radioimg }}
                    resizeMode="contain"
                    style={{
                      width: "100%",
                      height: "100%",
                      opacity: isCurrentStation && isPlaying ? 0.3 : 1,
                    }}
                  />

                  {/* Botón flotante centrado */}
                  {shouldShowButton && (
                    <View
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: [{ translateX: -35 }, { translateY: -35 }],
                        backgroundColor: "rgba(255,255,255,0.85)",
                        borderRadius: 999,
                        padding: 8,
                        justifyContent: "center",
                        alignItems: "center",
                        shadowColor: "#000",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                      }}
                    >
                      <Ionicons
                        name={
                          isPlaying ? "pause-circle" : "play-circle-outline"
                        }
                        size={60}
                        color="#ef4444"
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        <View className="px-4">
          <RadioDetails radio={radio} />
        </View>

        {/* Scroll Horizontal Relacionadas*/}
        <RadioHorizontalList
          title={`${radioStationBySlugQuery.data?.relatedStations.title}`}
          despription={`${radioStationBySlugQuery.data?.relatedStations.description}`}
          radios={
            radioStationBySlugQuery.data?.relatedStations
              ? [radioStationBySlugQuery.data?.relatedStations]
              : []
          }
          className="mb-5"
          loadNextPage={() => console.log("Cargar más relacionadas...")}
          // loadNextPage={topRatedQuery.fetchNextPage}
        />

        {/* Comentarios mb-48*/}
        <View className="mt-7 mb-10">
          <Comentarios
            title={radioData.radioname}
            type="radio"
            entityId={radioData.id}
            cantidad={radioData.commentsCount}
            // initialComments={radioData.lastComments ?? []}
          />
        </View>
      </ScrollView>
      {/* // </KeyboardAvoidingView> */}
    </>
  );
}
