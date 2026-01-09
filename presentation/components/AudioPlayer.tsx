import { formatTime } from "@/utils/formatTime";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { Link, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "nativewind";
import React, { memo, useEffect, useRef, useState } from "react";
// import { Animated, Easing } from "react-native";
import { API_URL } from "@/core/api/radioPodcastApi";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import TextTicker from "react-native-text-ticker";
import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";
import ThemedText from "../theme/components/themed-text";
import { PlayerBackground } from "./PlayerBackground";

const AudioPlayer = () => {
  const {
    streamUrl,
    radioName,
    radioimg,
    slug,
    isPlaying,
    // setIsFavorite,
    togglePlay,
    radioid,
    setStream,
    clearStream,
    volume,
    setVolume,
    episodeSlug,

    // isFavorite,
    type,
  } = useAudioPlayerStore();

  // const isFavorite = useAudioPlayerStore((state) => state.isFavorite);
  // const queryClient = useQueryClient();

  // const { mutate, isPending } = useToggleFavorite();

  // useFocusEffect(
  //   useCallback(() => {
  //     // aquí usas isFavorite
  //     console.log("Favorite al enfocar:", isFavorite);
  //   }, [isFavorite])
  // );

  // console.log({ radioid });

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const textColorClass = isDarkMode ? "#fff" : "#000";
  const pathname = usePathname();

  // 1. Inicialización del Reproductor
  const player = useAudioPlayer(streamUrl || "");
  const status = useAudioPlayerStatus(player);

  const [sliderValue, setSliderValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTarget, setSeekTarget] = useState(0);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);

  const translateY = useRef(new Animated.Value(1000)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFullPlayerVisible) {
      translateY.setValue(1000);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFullPlayerVisible]);

  const closeFullPlayer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 1000,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsFullPlayerVisible(false);
    });
  };

  const openFullPlayer = () => {
    setIsFullPlayerVisible(true);
  };

  // useEffect(() => {
  //   const unsubscribe = queryClient
  //     .getMutationCache()
  //     .subscribe((event: any) => {
  //       if (event.type === "updated") {
  //         const mutation = event.mutation;

  //         if (
  //           mutation.state.status === "success" &&
  //           mutation.options.mutationKey?.includes("toggleFavorite")
  //         ) {
  //           // 🔥 ACCESO EN TIEMPO REAL AL STORE
  //           const currentState = useAudioPlayerStore.getState();

  //           const variables = mutation.state.variables as any;
  //           const toggledSlug = variables?.radioSlug || variables?.podcastSlug;

  //           // Comparamos el slug que mutó afuera con el que está sonando REALMENTE ahora
  //           if (toggledSlug && toggledSlug === currentState.slug) {
  //             const newStatusFromServer = mutation.state.data?.isFavorite;

  //             if (typeof newStatusFromServer === "boolean") {
  //               // Sincronizamos el corazón del reproductor con el valor del servidor
  //               setIsFavorite(newStatusFromServer);
  //             } else {
  //               // Si el servidor no devuelve data, simplemente invertimos el estado actual del store
  //               setIsFavorite(!currentState.isFavorite);
  //             }
  //             console.log(
  //               "🔄 Sincronización externa detectada para:",
  //               toggledSlug
  //             );
  //           }
  //         }
  //       }
  //     });

  //   return () => unsubscribe();
  // }, []); // 👈 Importante: Vacío para que la suscripción sea global y persistente

  // useEffect(() => {
  //   if (!streamUrl) return;
  //   const saveFav = async () => {
  //     await SecureStore.setItemAsync(
  //       "isFavorite",
  //       isFavorite ? "true" : "false"
  //     );
  //   };
  //   saveFav();
  // }, [isFavorite]); // Se dispara cada vez que el corazón cambie

  // 🎯 1. CONFIGURACIÓN INICIAL
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionModeAndroid: "duckOthers",
      interruptionMode: "mixWithOthers",
      allowsRecording: false,
    });
  }, []);

  // 🎯 2. PERSISTENCIA: Cargar datos al arrancar
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedStream = await SecureStore.getItemAsync("streamUrl");
        if (savedStream && !streamUrl) {
          // Solo si no hay nada sonando actualmente
          const savedRadioName = await SecureStore.getItemAsync("radioName");
          const savedRadioImg = await SecureStore.getItemAsync("radioImg");
          const savedRadioSlug = await SecureStore.getItemAsync("slug");
          const savedRadioId = await SecureStore.getItemAsync("radioid");
          const savedepisodeSlug =
            await SecureStore.getItemAsync("episodeSlug");
          // const savedIsFavorite = await SecureStore.getItemAsync("isFavorite");
          const savedType = await SecureStore.getItemAsync("type");

          setStream(
            savedStream,
            savedRadioName || "",
            savedRadioImg || "",
            savedRadioSlug || "",
            savedRadioId || "",
            savedepisodeSlug || "",
            // savedIsFavorite === "true", // convertimos string a boolean
            (savedType as any) || "radio"
          );
          // Pausamos por defecto al recuperar para no asustar al usuario
          togglePlay(false);
        }
      } catch (e) {
        console.error("Error cargando SecureStore:", e);
      }
    };
    loadSavedState();
  }, []);

  // 🎯 3. GUARDAR ESTADO CUANDO CAMBIA
  useEffect(() => {
    if (!streamUrl) return;

    const saveState = async () => {
      try {
        await SecureStore.setItemAsync("streamUrl", streamUrl);
        await SecureStore.setItemAsync("radioName", radioName || "");
        await SecureStore.setItemAsync("radioImg", radioimg || "");
        await SecureStore.setItemAsync("slug", slug || "");
        await SecureStore.setItemAsync("radioid", radioid || "");
        await SecureStore.setItemAsync("episodeSlug", episodeSlug || "");
        // await SecureStore.setItemAsync("isFavorite",isFavorite ? "true" : "false");

        await SecureStore.setItemAsync("type", type || "radio");
        await SecureStore.setItemAsync(
          "isPlaying",
          isPlaying ? "true" : "false"
        );
      } catch (e) {
        console.error("Error guardando en SecureStore:", e);
      }
    };

    if (isPlaying) player.play();
    else player.pause();

    saveState();
  }, [isPlaying, streamUrl]);

  // 🎯 4. LÓGICA DE CONTROL DE CARGA (Buffering)
  const showLoading = isPlayerLoading || status.isBuffering;

  // 🎯 5. MANEJO DE SLIDER (Podcast)
  useEffect(() => {
    if (type === "podcast" && !isSeeking) {
      setSliderValue(status.currentTime);
    }
  }, [status.currentTime, isSeeking]);

  const onSliderSlidingComplete = (value: number) => {
    player.seekTo(value);
    setIsSeeking(false);
  };

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(
      0,
      Math.min(status.currentTime + seconds, status.duration)
    );
    player.seekTo(newTime);
  };

  const isRadio = type === "radio";

  // const handleToggleFavorite = () => {
  //   if (isPending || !slug) return;

  //   const previousValue = isFavorite; // Guardamos el valor actual por si falla
  //   const newValue = !isFavorite;

  //   const payload: FavoriteTogglePayload = {
  //     type: type as any,
  //     radioSlug: type === "radio" ? slug : undefined,
  //     podcastSlug: type === "podcast" ? slug : undefined,
  //   };

  //   // 1. Cambio visual instantáneo
  //   setIsFavorite(newValue);

  //   // 2. Mandar al servidor
  //   mutate(payload, {
  //     onError: () => {
  //       // Si falla, volvemos al valor que teníamos guardado
  //       setIsFavorite(previousValue);
  //     },
  //   });
  // };

  // 1. Estados necesarios
  const [isSleepModalVisible, setIsSleepModalVisible] = useState(false);
  const [sleepTimeLeft, setSleepTimeLeft] = useState<number | null>(null);

  // 2. Lógica del Timer corregida (Sin errores de TS)
  // useEffect(() => {
  //   let interval: any; // Usamos 'any' para evitar el conflicto entre number y Timeout en RN

  //   if (sleepTimeLeft !== null && sleepTimeLeft > 0) {
  //     interval = setInterval(() => {
  //       setSleepTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
  //     }, 60000); // Cada minuto
  //   } else if (sleepTimeLeft === 0) {
  //     player.pause();
  //     togglePlay(false);
  //     setSleepTimeLeft(null);
  //   }

  //   return () => clearInterval(interval);
  // }, [sleepTimeLeft]);

  // 2. Lógica del Timer con EFECTO PREMIUM (Fade-out)
  // useEffect(() => {
  //   let interval: any;

  //   if (sleepTimeLeft !== null && sleepTimeLeft > 0) {
  //     // Mientras el tiempo sea mayor a 0, descontamos cada minuto
  //     interval = setInterval(() => {
  //       setSleepTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
  //     }, 60000);
  //   } else if (sleepTimeLeft === 0) {
  //     // --- AQUÍ ENTRA EL EFECTO PREMIUM ---
  //     let fadeVol = volume; // Empezamos desde el volumen actual

  //     const fadeInterval = setInterval(() => {
  //       if (fadeVol > 0.1) {
  //         fadeVol -= 0.1;
  //         player.volume = fadeVol; // Bajamos el hardware poco a poco
  //       } else {
  //         // Cuando ya casi no se oye, apagamos todo
  //         clearInterval(fadeInterval);
  //         player.pause();
  //         togglePlay(false);
  //         setSleepTimeLeft(null); // Limpiamos el timer

  //         // Restauramos el volumen en el hardware para que la próxima vez
  //         // que el usuario de "Play" se escuche normal
  //         player.volume = volume;
  //       }
  //     }, 200); // Se ejecuta cada 200ms
  //   }

  //   return () => clearInterval(interval);
  // }, [sleepTimeLeft]);

  // 2. Lógica del Timer con EFECTO PREMIUM (Fade-out Corregido)
  useEffect(() => {
    let interval: any;

    if (sleepTimeLeft !== null && sleepTimeLeft > 0) {
      interval = setInterval(() => {
        setSleepTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 60000);
    } else if (sleepTimeLeft === 0) {
      // 🛑 IMPORTANTE: Tomamos el volumen actual directamente del hardware (player.volume)
      // No usamos la variable "volume" del store para evitar el salto.
      let fadeVol = player.volume;

      const fadeInterval = setInterval(() => {
        if (fadeVol > 0.05) {
          // Bajamos hasta que sea casi inaudible
          fadeVol -= 0.05; // Pasos más pequeños (0.05) para que sea más suave
          player.volume = fadeVol;
        } else {
          // Cuando ya llegamos al mínimo:
          clearInterval(fadeInterval);
          player.pause();
          togglePlay(false);
          setSleepTimeLeft(null);

          // Restauramos el volumen del hardware DESPUÉS de pausar
          // Usamos un pequeño delay para asegurar que el audio ya se detuvo
          setTimeout(() => {
            player.volume = volume;
          }, 500);
        }
      }, 150); // Intervalo un poco más rápido (150ms) para mayor fluidez
    }

    return () => clearInterval(interval);
  }, [sleepTimeLeft]);

  // 3. Función para activar
  const startSleepTimer = (minutes: number) => {
    setSleepTimeLeft(minutes);
    setIsSleepModalVisible(false); // 👈 Corregido el nombre
  };

  // compartir
  // const onShare = async () => {
  //   try {
  //     await Share.share({
  //       message: `¡Escucha ${radioName} conmigo en mi App de Radio! 📻\nLink: https://tuweb.com/radio/${slug}`,
  //       title: `Escuchando ${radioName}`,
  //     });
  //   } catch (error) {
  //     console.error("Error al compartir:", error);
  //   }
  // };

  // console.log({ episodeSlug });

  const onShare = async () => {
    // 1. Configuramos la URL base (puedes cambiarla luego por tu dominio real)
    // const baseUrl = "exp://192.168.100.58:8081";
    // const baseUrl = process.env.EXPO_PUBLIC_API_URL;
    // 2. Esta es para compartir (Externa)
    // const baseUrl = "https://aura-sonora-production.up.railway.app";

    // console.log({ baseUrl });

    // 2. Definimos el contenido según el tipo (Condicional Pro)
    const isRadio = type === "radio";

    const shareOptions = {
      title: isRadio ? `Radio en Vivo: ${radioName}` : `Podcast: ${radioName}`,
      message: isRadio
        ? `¡Estoy escuchando ${radioName} en vivo! 📻\nSintoniza conmigo aquí:\n${API_URL}/radio-station/${slug}`
        : `Te recomiendo este episodio de "${radioName}" 🎙️\nEscúchalo aquí:\n${API_URL}/podcastrd/${slug}?episode=${episodeSlug}`,
    };

    try {
      const result = await Share.share({
        message: shareOptions.message,
        title: shareOptions.title,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // compartido con éxito en una actividad específica
        } else {
          // compartido
        }
      } else if (result.action === Share.dismissedAction) {
        // cancelado
      }
    } catch (error: any) {
      console.error("Error al compartir:", error.message);
    }
  };

  // Validar si mostrar el mini reproductor
  // IMPORTANTE: Si no hay streamUrl, no renderizamos nada.
  if (!streamUrl) return null;

  const isPodcast = type === "podcast";
  const bannerMusic = !isPlaying
    ? require("../../assets/images/igualada.png")
    : require("../../assets/images/igualada.gif");
  const isSameSlug = pathname.includes(slug || "---");

  return (
    <>
      <PlayerBackground>
        <View
          style={{
            width: "100%",
            paddingHorizontal: 12,
            paddingVertical: 10,
            // height: showVolumeControl ? 135 : isPodcast ? 105 : 80,
            height: isPodcast ? 105 : 80,
            justifyContent: "center",
            position: "relative", // IMPORTANTE para que la capa touch se posicione bien
          }}
        >
          {/* 👇 CAPA DE TOQUE ULTRA SENSIBLE */}
          <TouchableWithoutFeedback onPress={openFullPlayer}>
            <View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1, // Asegura que quede debajo de tus botones
              }}
            />
          </TouchableWithoutFeedback>

          {/* Control de Volumen */}
          {/* {showVolumeControl && (
            <View className="flex-row items-center mx-4 w-full absolute top-2 z-50">
              <Ionicons name="volume-low" size={20} color="#f43f5e" />
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={1}
                value={player.volume}
                onValueChange={(v) => (player.volume = v)}
                minimumTrackTintColor="#f43f5e"
              />
              <Ionicons name="volume-high" size={20} color="#f43f5e" />
            </View>
          )} */}

          <View
            className="flex-row items-center justify-between"
            style={{ zIndex: 2 }}
          >
            {/* Info Radio/Podcast */}
            <Link
              href={isPodcast ? `/podcast/${slug}` : `/radio-station/${slug}`}
              asChild
            >
              <Pressable className="flex-row items-center flex-1">
                <Image
                  source={{ uri: radioimg as any }}
                  resizeMode="contain"
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27, // círculo perfecto
                    marginRight: 8,
                    backgroundColor: "white", // color base mientras carga
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    // backgroundColor: "#333"
                    // elevation: 5, // sombra Android
                  }}
                />
                <View className="ml-3 flex-1">
                  <TextTicker
                    style={{ color: textColorClass, fontWeight: "bold" }}
                    duration={10000}
                    loop
                    repeatSpacer={50}
                  >
                    <ThemedText className="text-rose-500">
                      {isPodcast ? "🎙️ " : "📻 "}
                    </ThemedText>
                    {radioName}
                  </TextTicker>
                </View>
              </Pressable>
            </Link>

            {/* Controles Play/Pause */}
            <View
              // className="flex-row items-center gap-3 mt-2"
              className={`flex-row items-center gap-3 ${isPodcast ? "mt-2" : "mr-10"}`}
            >
              {isPodcast && (
                <TouchableOpacity
                  onPress={() => handleSkip(-10)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Mejora la experiencia táctil
                >
                  <MaterialIcons
                    name="replay-10"
                    size={32}
                    color={textColorClass}
                    style={{ opacity: 0.8 }} // Un toque sutil de transparencia lo hace ver más elegante
                  />
                </TouchableOpacity>
              )}

              {/* Botón Central Play/Pause (Grande y destacado) */}
              <TouchableOpacity
                onPress={() => togglePlay()}
                activeOpacity={0.8}
                className="bg-rose-500 rounded-full shadow-lg shadow-rose-500/40 w-16 h-16 items-center justify-center" // Sombra suave (Glow effect)
                style={{ elevation: 5 }} // Sombra para Android
              >
                {showLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="white"
                    style={{ width: 32, height: 32 }}
                  />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "play"} // Usamos la versión sólida sin circulo para que el botón sea el circulo
                    size={32}
                    color="white"
                    style={{ marginLeft: isPlaying ? 0 : 4 }} // Corrección óptica para centrar el icono de Play
                  />
                )}
              </TouchableOpacity>

              {isPodcast && (
                <TouchableOpacity
                  onPress={() => handleSkip(10)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name="forward-10"
                    size={32}
                    color={textColorClass}
                    style={{ opacity: 0.8 }}
                  />
                </TouchableOpacity>
              )}

              {/* <TouchableOpacity
                onPress={() => setShowVolumeControl(!showVolumeControl)}
              >
                <Ionicons
                  name="volume-medium"
                  size={20}
                  color={textColorClass}
                />
              </TouchableOpacity> */}

              {/* <TouchableOpacity onPress={() => clearStream()}>
                <Ionicons name="close-circle" size={20} color="#fb7185" />
              </TouchableOpacity> */}
            </View>

            <View
              // className="absolute right-0 bottom-[40px] z-[999]"
              className={`absolute z-[999] right-2 ${isPodcast ? "bottom-[52px]" : "bottom-[40px] right-0"}`}
              style={{
                elevation: 14, // Android
                shadowColor: "#fb7185", // iOS (sombra tintada)
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsFullPlayerVisible(true)}
                activeOpacity={0.7}
                className="bg-black rounded-full px-2 py-1 flex-row items-center"
              >
                <Ionicons name="chevron-up" size={17} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* <View
              // className="absolute right-40 left-30 bottom-5 z-[999]"
              className="absolute right-0 bottom-10"
              style={{
                elevation: 14, // Android
                shadowColor: "#fb7185", // iOS (sombra tintada)
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setIsFullPlayerVisible(true)}
                activeOpacity={0.75}
                className="bg-rose-500 p-1 rounded-full"
              >
                <Ionicons name="arrow-up" size={25} color="#fff" />
              </TouchableOpacity>
            </View> */}
          </View>

          {/* <ion-icon name="arrow-up-circle-outline"></ion-icon> */}
          {/* Progress Bar (Podcast) */}
          {isPodcast && (
            <View className="mt-1 flex-row items-center mb-2">
              <ThemedText className="text-[10px] w-8">
                {formatTime(status.currentTime)}
              </ThemedText>
              <Slider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={status.duration}
                value={sliderValue}
                onValueChange={(v) => {
                  setIsSeeking(true);
                  setSliderValue(v);
                }}
                onSlidingComplete={onSliderSlidingComplete}
                minimumTrackTintColor="#f43f5e"
                maximumTrackTintColor="#555"
              />
              <ThemedText className="text-[10px] w-8">
                {formatTime(status.duration)}
              </ThemedText>
            </View>
          )}
        </View>
      </PlayerBackground>

      {/* 2. EL REPRODUCTOR FULL SCREEN (Sin librerías raras) */}
      <Modal
        visible={isFullPlayerVisible}
        // animationType="slide"
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        // onRequestClose={() => setIsFullPlayerVisible(false)}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            opacity,
          }}
        />

        <TouchableWithoutFeedback onPress={closeFullPlayer}>
          {/* Full Player */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              top: 0,
              transform: [{ translateY }],
            }}
          >
            <View style={{ flex: 1, backgroundColor: "#000" }}>
              {/* 1. FONDO CON BLUR (ATMÓSFERA) */}
              <ImageBackground
                source={{ uri: radioimg as any }}
                style={{ ...StyleSheet.absoluteFillObject }}
                blurRadius={20}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                  style={{ flex: 1 }}
                />
              </ImageBackground>

              {/* 2. BOTÓN CERRAR (ABSOLUTO PARA NO ESTORBAR) */}
              <TouchableOpacity
                // onPress={() => setIsFullPlayerVisible(false)}
                onPress={closeFullPlayer}
                className="absolute top-12 left-5 z-50 p-2"
              >
                <Ionicons name="chevron-down" size={35} color="white" />
              </TouchableOpacity>

              {/* <TouchableOpacity
                // onPress={() => setIsFullPlayerVisible(false)}
                onPress={closeFullPlayer}
                className="absolute top-12 right-5 z-50 p-2"
              >
                <Ionicons name="chevron-down" size={35} color="white" />
              </TouchableOpacity> */}

              <TouchableOpacity
                className="absolute top-12 right-2 z-50 p-2 items-center"
                onPress={() => clearStream()}
                activeOpacity={0.7}
              >
                <View className="bg-rose-500/40 p-3 rounded-full mb-1">
                  <Ionicons name="close-circle" size={20} color="white" />
                </View>
                <ThemedText className="text-white text-[9px] font-medium uppercase tracking-wider">
                  Cerrar
                </ThemedText>
              </TouchableOpacity>

              {/* 3. CONTENIDO PRINCIPAL */}
              <View className="flex-1 justify-around items-center px-8 pt-20 pb-10">
                {/* Imagen de la Radio (Card Premium) */}
                <View
                  style={{
                    width: 280,
                    height: 280,
                    borderRadius: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 15,
                    elevation: 10,
                  }}
                >
                  <Image
                    source={{ uri: radioimg as any }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 20,
                      backgroundColor: "white",
                    }}
                    resizeMode="contain"
                  />
                </View>

                {/* Títulos */}
                <View className="items-center">
                  <ThemedText className="text-white text-3xl font-bold text-center">
                    {radioName}
                  </ThemedText>
                  <ThemedText className="text-rose-500 text-lg mt-1 font-medium">
                    {type === "podcast"
                      ? "Episodio de Podcast"
                      : "Radio en Vivo"}
                  </ThemedText>

                  <View
                    style={{
                      padding: 6, // Espacio para que respire la sombra
                      backgroundColor: "#FFF",
                      borderRadius: 12,
                    }}
                  >
                    <Image
                      source={bannerMusic}
                      style={{
                        width: 54,
                        height: 54,
                        // borderRadius: 12,

                        // iOS Shadow
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,

                        // Android
                        // elevation: 6,

                        borderWidth: 0.5,
                        borderColor: "rgba(0,0,0,0.08)",
                      }}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Slider (Solo si es Podcast) */}
                {type === "podcast" && (
                  <View className="w-full">
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={status.duration}
                      value={sliderValue}
                      minimumTrackTintColor="#f43f5e"
                      maximumTrackTintColor="rgba(255,255,255,0.3)"
                      onSlidingComplete={onSliderSlidingComplete}
                    />
                    <View className="flex-row justify-between px-2">
                      <ThemedText className="text-white text-xs">
                        {formatTime(status.currentTime)}
                      </ThemedText>
                      <ThemedText className="text-white text-xs">
                        {formatTime(status.duration)}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* CONTROLES PRINCIPALES */}
                {/* <View className="flex-row items-center justify-between w-full px-5"> */}
                {type === "podcast" ? (
                  <View className="flex-row items-center justify-between w-full px-5">
                    {type === "podcast" && (
                      <TouchableOpacity
                        onPress={() => handleSkip(-10)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Mejora la experiencia táctil
                      >
                        <MaterialIcons
                          name="replay-10"
                          size={40}
                          color="white"
                          style={{ opacity: 0.8 }} // Un toque sutil de transparencia lo hace ver más elegante
                        />
                      </TouchableOpacity>
                      // <TouchableOpacity onPress={() => handleSkip(-10)}>
                      //   <Ionicons name="play-back" size={40} color="white" />
                      // </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => togglePlay()}
                      style={{
                        backgroundColor: "white",
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {showLoading ? (
                        <ActivityIndicator size="large" color="#f43f5e" />
                      ) : (
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={50}
                          color="#f43f5e"
                        />
                      )}
                    </TouchableOpacity>

                    {type === "podcast" && (
                      <TouchableOpacity
                        onPress={() => handleSkip(10)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MaterialIcons
                          name="forward-10"
                          size={40}
                          color="white"
                          style={{ opacity: 0.8 }}
                        />
                      </TouchableOpacity>
                      // <TouchableOpacity onPress={() => handleSkip(10)}>
                      //   <Ionicons name="play-forward" size={40} color="white" />
                      // </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View className="flex-row items-center justify-between w-full px-5">
                    {/* BOTÓN COMPARTIR */}
                    <TouchableOpacity
                      className="items-center"
                      onPress={onShare}
                      activeOpacity={0.7}
                    >
                      <View className="bg-white/10 p-3 rounded-full mb-1">
                        <Ionicons
                          name="share-social-outline"
                          size={28}
                          color="white"
                        />
                      </View>
                      <ThemedText className="text-white text-[10px] font-medium uppercase tracking-wider">
                        Compartir
                      </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => togglePlay()}
                      style={{
                        backgroundColor: "white",
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {showLoading ? (
                        <ActivityIndicator size="large" color="#f43f5e" />
                      ) : (
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={50}
                          color="#f43f5e"
                        />
                      )}
                    </TouchableOpacity>

                    {/* BOTÓN SLEEP TIMER */}
                    <TouchableOpacity
                      className="items-center"
                      onPress={() => setIsSleepModalVisible(true)} // 👈 Nombre corregido
                    >
                      <View className="relative bg-white/10 p-3 rounded-full mb-1">
                        <Ionicons
                          name="timer-outline"
                          size={32}
                          color={sleepTimeLeft ? "#f43f5e" : "white"}
                        />
                        {sleepTimeLeft !== null && (
                          <View className="absolute -top-2 -right-2 bg-rose-500 rounded-full h-5 w-5 justify-center items-center">
                            <ThemedText className="text-white text-[9px] font-bold">
                              {sleepTimeLeft}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText className="text-white text-[10px] font-medium uppercase tracking-wider">
                        {sleepTimeLeft ? "Activo" : "Dormir"}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {type === "podcast" && (
                  <View className="flex-row justify-around w-full py-3 border-t border-white/10 mt-2">
                    {/* BOTÓN FAVORITOS (Grande y con efecto) */}
                    {/* <TouchableOpacity
                className="items-center"
                onPress={handleToggleFavorite}
                disabled={isPending}
                // onPress={() => toggleFavorite(radioid)} // Necesitaremos esta función en tu store
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={32}
                  color={"#f43f5e"}
                />
                <ThemedText className="text-white text-[10px] mt-1">
                  Favorito
                </ThemedText>
              </TouchableOpacity> */}

                    {/* BOTÓN COMPARTIR */}

                    <TouchableOpacity
                      className="items-center"
                      onPress={onShare}
                      activeOpacity={0.7}
                    >
                      <View className="bg-white/10 p-3 rounded-full mb-1">
                        <Ionicons
                          name="share-social-outline"
                          size={28}
                          color="white"
                        />
                      </View>
                      <ThemedText className="text-white text-[10px] font-medium uppercase tracking-wider">
                        Compartir
                      </ThemedText>
                    </TouchableOpacity>

                    {/* BOTÓN SLEEP TIMER */}
                    <TouchableOpacity
                      className="items-center"
                      onPress={() => setIsSleepModalVisible(true)} // 👈 Nombre corregido
                    >
                      <View className="relative bg-white/10 p-3 rounded-full mb-1">
                        <Ionicons
                          name="timer-outline"
                          size={32}
                          color={sleepTimeLeft ? "#f43f5e" : "white"}
                        />
                        {sleepTimeLeft !== null && (
                          <View className="absolute -top-2 -right-2 bg-rose-500 rounded-full h-5 w-5 justify-center items-center">
                            <ThemedText className="text-white text-[9px] font-bold">
                              {sleepTimeLeft}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText className="text-white text-[10px] font-medium uppercase tracking-wider">
                        {sleepTimeLeft ? "Activo" : "Dormir"}
                      </ThemedText>
                    </TouchableOpacity>

                    {/* <TouchableOpacity
                      className="items-center"
                      onPress={() => clearStream()}
                      activeOpacity={0.7}
                    >
                      <View className="bg-rose-500/20 p-3 rounded-full mb-1">
                        <Ionicons
                          name="close-circle"
                          size={28}
                          color="#fb7185"
                        />
                      </View>
                      <ThemedText className="text-rose-500 text-[10px] font-medium uppercase tracking-wider">
                        Cerrar
                      </ThemedText>
                    </TouchableOpacity> */}
                  </View>
                )}

                {/* FILA DE ACCIONES PRO */}

                {/* Control de Volumen Inferior */}
                <View className="flex-row items-center w-full px-5 space-x-3 mb-7">
                  {/* Botón Mute / Unmute */}
                  <TouchableOpacity onPress={() => (player.volume = 0.0001)}>
                    <Ionicons
                      name="volume-mute"
                      size={20}
                      color="rgba(255,255,255,0.5)"
                    />
                  </TouchableOpacity>
                  <Slider
                    style={{ flex: 1 }}
                    minimumValue={0}
                    maximumValue={1}
                    value={player.volume}
                    onValueChange={(v) => (player.volume = v)}
                    minimumTrackTintColor="white"
                    maximumTrackTintColor="#f43f5e"
                    // maximumTrackTintColor="rgba(255,255,255,0.3)"
                  />
                  {/* Icono de Volumen Máximo (Subir a 1) */}
                  <TouchableOpacity onPress={() => (player.volume = 1)}>
                    <Ionicons
                      name="volume-high"
                      size={20}
                      color="#f43f5e"
                      // color="rgba(255,255,255,0.5)"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* MODAL DE SLEEP TIMER */}
              <Modal
                visible={isSleepModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsSleepModalVisible(false)}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View className="bg-zinc-900 w-80 rounded-3xl p-6 border border-white/10">
                    <ThemedText className="text-white text-xl font-bold text-center mb-6">
                      Apagado Automático
                    </ThemedText>

                    <View className="space-y-3">
                      {[5, 10, 15, 30, 45, 60].map((minutes) => (
                        <TouchableOpacity
                          key={minutes}
                          onPress={() => startSleepTimer(minutes)}
                          className="bg-white/5 py-4 rounded-xl items-center active:bg-rose-500"
                        >
                          <ThemedText className="text-white font-medium">
                            {minutes} minutos
                          </ThemedText>
                        </TouchableOpacity>
                      ))}

                      {sleepTimeLeft !== null && (
                        <TouchableOpacity
                          onPress={() => {
                            setSleepTimeLeft(null);
                            setIsSleepModalVisible(false);
                          }}
                          className="bg-rose-500/20 py-4 rounded-xl items-center mt-4"
                        >
                          <ThemedText className="text-rose-500 font-bold">
                            Cancelar Temporizador
                          </ThemedText>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => setIsSleepModalVisible(false)}
                        className="py-4 items-center"
                      >
                        <ThemedText className="text-rose-500 bg-rose-500/20 p-2 rounded-xl font-semibold">
                          Cerrar
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default memo(AudioPlayer);
// export default AudioPlayer;

// import { formatTime } from "@/utils/formatTime";
// import { Ionicons } from "@expo/vector-icons";
// import Slider from "@react-native-community/slider";
// // Asumimos este hook tiene load/unload
// import {
//   setAudioModeAsync,
//   useAudioPlayer,
//   useAudioPlayerStatus,
// } from "expo-audio"; // Asumimos este hook tiene load/unload
// import { Link, usePathname } from "expo-router";
// import * as SecureStore from "expo-secure-store";
// import { useColorScheme } from "nativewind";
// import React, { memo, useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Image,
//   Pressable,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import TextTicker from "react-native-text-ticker";
// import { useThemeChangerContext } from "../context/ThemeChangerContext";
// import { useAudioPlayerStore } from "../radio/store/useAudioPlayerStore";
// import ThemedText from "../theme/components/themed-text";
// import { PlayerBackground } from "./PlayerBackground";

// // Asunción del tipo de retorno del hook useAudioPlayer para tipado
// interface AudioPlayerHook {
//   loading: boolean;
//   playing: boolean;
//   duration: number;
//   currentTime: number;
//   play: () => void;
//   pause: () => void;
//   // 🎯 CRÍTICO: Necesitamos funciones para forzar el ciclo de vida
//   load: () => Promise<void>;
//   unload: () => Promise<void>;
//   volume: number;
//   // 🎯 CRÍTICO: Función para buscar una posición específica
//   seekTo: (
//     seconds: number,
//     toleranceBefore?: number,
//     toleranceAfter?: number
//   ) => void;
//   // 📢 AÑADE ESTOS MÉTODOS BASADOS EN LA DOCUMENTACIÓN:
//   clearLockScreenControls: () => void;
//   setActiveForLockScreen: (
//     active: boolean,
//     metadata?: any, // Usar 'any' si no tienes tipos definidos para AudioMetadata
//     options?: any // Usar 'any' si no tienes tipos definidos para AudioLockScreenOptions
//   ) => void;
//   updateLockScreenMetadata: (metadata: any) => void;
//   // ... otras propiedades
// }

// // export default function AudioPlayer() {
// const AudioPlayer = () => {
//   const {
//     streamUrl,
//     radioName,
//     radioimg,
//     slug,
//     isPlaying,
//     togglePlay,
//     radioid,
//     setStream,
//     clearStream,
//     volume,
//     setVolume,
//     type,
//   } = useAudioPlayerStore();

//   // BG Linear Gradient
//   const { currentTheme } = useThemeChangerContext();
//   const { colorScheme } = useColorScheme();
//   const isDarkMode = colorScheme === "dark";

//   const textColorClass = isDarkMode ? "#fff" : "#000";

//   // 1. Inicialización del Reproductor (Hook)
//   const player = useAudioPlayer(streamUrl || "", {
//     downloadFirst: false, // Streaming
//     updateInterval: 1000,
//   }) as unknown as AudioPlayerHook; // Forzamos el tipado

//   const pathname = usePathname();

//   const status = useAudioPlayerStatus(player as any); // 👈 Usa el objeto 'player'

//   // NUEVOS ESTADOS PARA EL SLIDER DEL PODCAST
//   const [sliderValue, setSliderValue] = useState(0);
//   const [isSeeking, setIsSeeking] = useState(false);
//   const [seekTarget, setSeekTarget] = useState(0); // 👈 NUEVO: Posición de destino

//   const [showVolumeControl, setShowVolumeControl] = useState(false);
//   const [isPlayerLoading, setIsPlayerLoading] = useState(false); // Estado para mostrar carga al cambiar emisora

//   // No hacer prefect al mismo slug
//   const currentSlug = pathname.startsWith("/radio-station/")
//     ? pathname.split("/radio-station/")[1]
//     : null;

//   const isSameSlug = currentSlug === slug;

//   // 🎯 0. CONFIGURACIÓN INICIAL DEL MODO DE AUDIO (CORREGIDA)
//   useEffect(() => {
//     const configureAudioMode = async () => {
//       try {
//         // 1. Configurar el modo de audio para segundo plano y streaming
//         // Se llama a la función importada: setAudioModeAsync
//         await setAudioModeAsync({
//           playsInSilentMode: true,
//           shouldPlayInBackground: true,
//           interruptionModeAndroid: "duckOthers",
//           interruptionMode: "mixWithOthers",
//           allowsRecording: false,
//         });
//       } catch (e) {
//         console.error("Error al configurar AudioMode:", e);
//       }
//     };

//     configureAudioMode();
//   }, []);

//   //
//   // 🎯 2. EFECTO CRÍTICO DE CARGA Y DESCARGA (SOLUCIÓN AL DOBLE AUDIO)
//   // Se ejecuta cada vez que el streamUrl cambia.
//   //
//   useEffect(() => {
//     // Si no hay URL, aseguramos que la carga termine y salimos.
//     if (!streamUrl) {
//       setIsPlayerLoading(false); // 💡 CRÍTICO: Aseguramos que se apague la carga
//       if (player.unload) {
//         player
//           .unload()
//           .catch((e) => console.error("Error al descargar stream nulo:", e));
//       }
//       return;
//     }

//     const loadNewStream = async () => {
//       try {
//         setIsPlayerLoading(true); // 💡 INICIO DE CARGA

//         // 1. CRÍTICO: Descarga explícitamente el stream anterior.
//         if (player.unload) {
//           await player
//             .unload()
//             .catch((e) =>
//               console.error("Error al descargar stream anterior:", e)
//             );
//         }

//         // 2. Carga el nuevo stream
//         if (player.load) {
//           await player
//             .load()
//             .catch((e) => console.error("Error al cargar nuevo stream:", e));
//         }

//         // 3. Iniciar reproducción si isPlaying es true (lo cual setStream garantiza)
//         if (isPlaying && player.play) {
//           player.play();
//         }
//       } catch (e) {
//         console.error("Error en loadNewStream:", e);
//       } finally {
//         // 💡 CRÍTICO: Esto garantiza que el loading se desactive siempre
//         setIsPlayerLoading(false);
//       }
//     };

//     loadNewStream();

//     // 4. CLEANUP: Asegura que si el componente se desmonta, el audio se detenga.
//     return () => {
//       if (player.unload) {
//         player
//           .unload()
//           .catch((e) => console.error("Error en cleanup al desmontar:", e));
//       }
//     };
//   }, [streamUrl]); // Solo reacciona al cambio de la URL
//   //
//   // 3. PERSISTENCIA: Cargar datos guardados (Arreglando el async/await)
//   //
//   useEffect(() => {
//     const loadSavedState = async () => {
//       try {
//         // Usamos getItemAsync de SecureStore que ya es una función asíncrona
//         const savedStream = await SecureStore.getItemAsync("streamUrl");
//         const savedRadioName = await SecureStore.getItemAsync("radioName");
//         const savedRadioImg = await SecureStore.getItemAsync("radioImg");
//         const savedRadioSlug = await SecureStore.getItemAsync("slug");
//         const savedRadioId = await SecureStore.getItemAsync("radioid");
//         const savedIsPlaying =
//           (await SecureStore.getItemAsync("isPlaying")) === "true";
//         const savedType = (await SecureStore.getItemAsync("type")) as
//           | "radio"
//           | "podcast"
//           | null;

//         if (
//           savedStream &&
//           savedRadioName &&
//           savedRadioImg &&
//           savedRadioSlug &&
//           savedRadioId
//         ) {
//           // 1. Establecemos el nuevo stream (lo cual establece isPlaying=true)
//           setStream(
//             savedStream,
//             savedRadioName,
//             savedRadioImg,
//             savedRadioSlug,
//             savedRadioId,
//             savedType ?? "radio" // fallback a 'radio' si no existe
//           );

//           // 2. Si al guardar estaba pausado, lo pausamos inmediatamente después de cargar.
//           if (!savedIsPlaying) {
//             togglePlay(false); // Forzar a isPlaying = false
//           }
//         }
//       } catch (e) {
//         console.error("Error al cargar datos de SecureStore:", e);
//       }
//     };

//     loadSavedState();
//   }, []); // Se ejecuta una sola vez al montar
//   //
//   // 4. SINCRONIZACIÓN PLAY/PAUSE (Simplificado y seguro)
//   //
//   useEffect(() => {
//     if (!streamUrl) return; // No hay stream, no hay acción

//     try {
//       if (isPlaying) {
//         // Si el estado global es PLAYING, llama a play en el reproductor.
//         player.play();
//         SecureStore.setItem("isPlaying", "true");
//       } else {
//         // Si el estado global es PAUSED, llama a pause en el reproductor.
//         player.pause();
//         SecureStore.setItem("isPlaying", "false");
//       }
//       // Guardar metadata en SecureStore
//       SecureStore.setItem("streamUrl", streamUrl || "");
//       SecureStore.setItem("radioName", radioName || "");
//       SecureStore.setItem("radioImg", radioimg || "");
//       SecureStore.setItem("slug", slug || "");
//       SecureStore.setItem("radioid", radioid || "");
//       SecureStore.setItemAsync("type", type ?? "radio"); // GUARDA type, por defecto 'radio'
//     } catch (e) {
//       console.error("Error durante play/pause sync:", e);
//     }
//   }, [isPlaying, streamUrl]); // Solo reacciona a isPlaying y streamUrl (para guardar metadata)

//   //
//   // 5. SINCRONIZACIÓN DE VOLUMEN
//   //
//   useEffect(() => {
//     // Asumimos que player.volume es un setter que el hook proporciona
//     player.volume = volume / 100;
//   }, [volume, player]);

//   const handleClose = () => {
//     clearStream();
//   };

//   // 🎯 NUEVO useEffect: Sincronizar currentTime con el slider, y esperar el buffering.
//   useEffect(() => {
//     const isPodcast = type === "podcast";

//     if (!isPodcast) return;

//     // Lógica de Sincronización (si no estamos buscando)
//     if (!isSeeking) {
//       if (!isNaN(status.currentTime)) {
//         setSliderValue(status.currentTime);
//       }
//     }

//     // 💡 LÓGICA DE TRANSICIÓN FLUIDA UNIVERSAL (Para Adelantar y Retroceder)
//     if (isSeeking && !status.isBuffering && seekTarget > 0.1) {
//       // Mide la diferencia absoluta entre el tiempo real y el objetivo.
//       const timeDifference = Math.abs(status.currentTime - seekTarget);

//       // Si la diferencia es menor a 0.5s, asumimos que el salto fue exitoso.
//       const isTargetReached = timeDifference < 0.5;

//       if (isTargetReached) {
//         // 💡 ¡ÉXITO! El audio ha llegado a la nueva posición.

//         // Esto es vital: Asegura que el Slider y el texto salten al valor CORRECTO antes
//         // de que status.currentTime termine de sincronizarse.
//         setSliderValue(seekTarget);

//         setIsSeeking(false); // Desactiva la búsqueda (retoma la sincronización con status.currentTime)
//         setSeekTarget(0); // Resetea el objetivo
//       }
//     }

//     // Añadimos status.isBuffering como dependencia para reaccionar inmediatamente
//   }, [
//     status.currentTime,
//     status.isBuffering,
//     type,
//     isSeeking,
//     seekTarget,
//     sliderValue,
//   ]);

//   const onSliderValueChange = (value: number) => {
//     setIsSeeking(true); // El usuario ha comenzado a arrastrar
//     setSliderValue(value); // Actualiza el slider visualmente
//   };

//   const onSliderSlidingComplete = async (value: number) => {
//     // 💡 CRÍTICO: Aseguramos que sliderValue tenga la posición de destino. // setSliderValue(value);
//     setSeekTarget(value);

//     // 💡 Paso 1: Indica que el salto ha comenzado (isSeeking = true)
//     // No usamos isPlayerLoading aquí, ya que el estado isBuffering lo manejará.
//     if (player.seekTo) {
//       try {
//         player.seekTo(value);
//         // 💡 CRÍTICO: NO desactivamos isSeeking ni usamos delay aquí.
//         // setSliderValue(value); // Opcional: para forzar el valor inmediatamente
//       } catch (e) {
//         console.error("Error al hacer seekTo:", e);
//       }
//     }
//   };

//   // --- NUEVAS FUNCIONES DE SALTO ---
//   const handleSkip = (seconds: number) => {
//     // Solo permitir saltos si es un podcast y hay una duración válida
//     if (type !== "podcast" || status.duration <= 0) {
//       return;
//     }

//     // 1. Calcular la nueva posición
//     const newTime = status.currentTime + seconds;

//     // 2. Aplicar límites (No ir más allá de 0 ni de la duración total)
//     const finalTime = Math.max(0, Math.min(newTime, status.duration));

//     // 3. Forzar el estado de búsqueda para la fluidez visual
//     setIsSeeking(true);
//     setSliderValue(finalTime);
//     setSeekTarget(finalTime); // Asegura que la lógica de confirmación sepa el destino

//     // 4. Llamar a la función de salto (el useEffect se encargará de desactivar isSeeking)
//     if (player.seekTo) {
//       player.seekTo(finalTime);
//     }

//     // 5. Asegurar que la reproducción continúe si estaba en pausa
//     if (!isPlaying) {
//       togglePlay(true); // Forzar el estado de Zustand a 'true'
//     }
//   };

//   const isPodcast = type === "podcast";
//   const isStreamReady = streamUrl && radioName && radioimg && slug;

//   const handleSkipBackward = () => handleSkip(-10); // Retrocede 10 segundos
//   const handleSkipForward = () => handleSkip(10); // Avanza 10 segundos

//   if (!isStreamReady) return null;
//   if (!streamUrl || !radioName || !radioimg || !slug) return null;

//   // const showLoading = isPlayerLoading;
//   const showLoading = isPlayerLoading || status.isBuffering; // 👈 ¡CRÍTICO!

//   return (
//     <PlayerBackground>
//       <View
//         style={{
//           // backgroundColor: isDarkMode ? "#0e0d0d" : "#686767",
//           // backgroundColor: "transparent",
//           width: "100%",
//           flexDirection: "row",
//           alignItems: "center",
//           justifyContent: "space-between",
//           paddingHorizontal: 12,
//           paddingVertical: 10,
//           // borderTopWidth: 1,
//           // borderTopColor: "#333",
//           height: showVolumeControl
//             ? isPodcast
//               ? 135
//               : 135
//             : isPodcast
//               ? 105
//               : 75,

//           shadowColor: "#000",
//           shadowOffset: { width: 0, height: -3 },
//           shadowOpacity: 0.25,
//           shadowRadius: 6,
//           elevation: 99,
//         }}
//       >
//         {/* {isDarkMode ? (
//         <LinearGradient
//           colors={["#000000", "#023550", "#280236"]}
//           className="absolute top-0 left-0 right-0 h-40 rounded-b-3xl"
//         />
//       ) : (
//         <LinearGradient
//           colors={["#FFFFFF", "#F0F4F8", "#E0F7FA"]}
//           className="absolute top-0 left-0 right-0 h-40 rounded-b-3xl"
//         />
//       )} */}

//         {/* 💡 SLIDER DE VOLUMEN (CONDICIONAL) */}
//         {showVolumeControl && (
//           <View className="flex-row items-center mx-4 w-full mb-[110px] absolute ">
//             <Ionicons
//               name="volume-low"
//               size={20}
//               color="#f43f5e"
//               style={{ marginRight: 8 }}
//             />
//             <Slider
//               style={{ flex: 1 }}
//               minimumValue={0}
//               maximumValue={100}
//               step={1}
//               value={volume}
//               onSlidingComplete={(value) => setVolume(value)}
//               minimumTrackTintColor="#f43f5e"
//               maximumTrackTintColor="#a0a0a0"
//               thumbTintColor="#fff"
//             />
//             <Ionicons
//               name="volume-high"
//               size={20}
//               color="#f43f5e"
//               style={{ marginLeft: 8 }}
//             />
//           </View>
//         )}

//         {/* BARRA PRINCIPAL (IMAGEN, TÍTULO Y CONTROLES) */}
//         <View
//           className="flex-row items-center w-full justify-between pb-2"
//           key={slug} // Aseguramos que se actualice la vista si el slug cambia
//         >
//           {/* ✅ Enlace a la emisora (solo si es distinto slug) */}
//           {isSameSlug ? (
//             <Pressable
//               className="flex-row items-center flex-shrink"
//               style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
//             >
//               <Image
//                 source={{ uri: radioimg }}
//                 resizeMode="contain"
//                 style={{
//                   width: 60,
//                   height: 60,
//                   borderRadius: 30, // círculo perfecto
//                   marginRight: 8,
//                   backgroundColor: "white", // color base mientras carga
//                   shadowColor: "#000",
//                   shadowOffset: { width: 0, height: 2 },
//                   shadowOpacity: 0.5,
//                   shadowRadius: 8,
//                   // elevation: 5, // sombra Android
//                 }}
//               />

//               <View>
//                 <TextTicker
//                   style={{
//                     color: "white",
//                     fontSize: 16,
//                     // maxWidth: 190
//                   }}
//                   duration={8000}
//                   loop
//                   bounce={false}
//                   repeatSpacer={50}
//                   marqueeDelay={1000}
//                 >
//                   <ThemedText
//                     style={{
//                       // color: "white",
//                       fontWeight: "700",
//                       flexShrink: 1, // evita que el texto rompa el layout
//                     }}
//                     numberOfLines={0} // sin límite de líneas
//                   >
//                     <ThemedText className="text-[#f43f5e]">
//                       📻 En vivo:{" "}
//                     </ThemedText>

//                     {radioName}
//                   </ThemedText>
//                 </TextTicker>
//               </View>
//             </Pressable>
//           ) : (
//             <Link
//               //!MODIFIQUEE
//               href={
//                 type === "radio" ? `/radio-station/${slug}` : `/podcast/${slug}`
//               }
//               push
//               asChild
//               prefetch
//             >
//               <Pressable
//                 className="flex-row items-center flex-shrink"
//                 style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
//               >
//                 <Image
//                   source={{ uri: radioimg }}
//                   resizeMode="contain"
//                   style={{
//                     width: 60,
//                     height: 60,
//                     borderRadius: 30, // círculo perfecto
//                     marginRight: 8,
//                     backgroundColor: "#f3f4f6", // color base mientras carga
//                     shadowColor: "#000",
//                     shadowOffset: { width: 0, height: 2 },
//                     shadowOpacity: 0.2,
//                     shadowRadius: 4,
//                     // elevation: 5, // sombra Android
//                   }}
//                 />
//                 {/* <View style={{ maxWidth: 185, flexDirection: "column" }}>  */}
//                 <View>
//                   <TextTicker
//                     style={{
//                       color: "white",
//                       fontSize: 16,
//                       width: 190,
//                       height: 20,
//                     }}
//                     duration={8000}
//                     loop
//                     bounce={false}
//                     repeatSpacer={50}
//                     marqueeDelay={1000}
//                     numberOfLines={2}
//                   >
//                     <ThemedText
//                       style={{
//                         // color: "white",
//                         fontWeight: "700",
//                         flexShrink: 1, // evita que el texto rompa el layout
//                       }}
//                       numberOfLines={0} // sin límite de líneas
//                     >
//                       {type === "radio" ? (
//                         <ThemedText className="text-rose-600">
//                           📻 En vivo:{" "}
//                         </ThemedText>
//                       ) : (
//                         <ThemedText className="text-rose-600">
//                           🎙️ Episodio:{" "}
//                         </ThemedText>
//                       )}
//                       {radioName}
//                     </ThemedText>

//                     {/* <Text className="font-semibold text-base">
//                     {type === "radio" ? "📻 En vivo: " : "🎙️ Episodio: "}
//                     {radioName}
//                   </Text> */}
//                   </TextTicker>
//                 </View>
//               </Pressable>
//             </Link>
//           )}

//           {/* Controles */}
//           <View className="flex-row items-center justify-items-end gap-1 pt-5">
//             {/* 🎧 Controles de Podcast (Avance/Retroceso Rápido) */}

//             {isPodcast && (
//               <View className="absolute flex-row gap-12 bottom-14 right-5">
//                 {/* Botón Volumen */}
//                 <TouchableOpacity
//                   onPress={() => setShowVolumeControl((prev) => !prev)}
//                   className="bg-white dark:bg-black rounded-full"
//                 >
//                   <Ionicons
//                     name={
//                       showVolumeControl ? "volume-medium" : "volume-low-sharp"
//                     }
//                     size={25}
//                     color={textColorClass}
//                   />
//                 </TouchableOpacity>

//                 {/* Botón Cerrar */}
//                 <TouchableOpacity onPress={handleClose}>
//                   <Ionicons name="close-circle" size={25} color="#f87171" />
//                 </TouchableOpacity>
//               </View>
//             )}

//             {isPodcast ? (
//               <TouchableOpacity onPress={handleSkipBackward}>
//                 <Ionicons
//                   name="play-skip-back-circle"
//                   size={34}
//                   color={textColorClass}
//                 />
//               </TouchableOpacity>
//             ) : (
//               <TouchableOpacity
//                 onPress={() => setShowVolumeControl((prev) => !prev)}
//                 className="bg-white dark:bg-black rounded-full"
//               >
//                 <Ionicons
//                   name={
//                     showVolumeControl ? "volume-medium" : "volume-low-sharp"
//                   }
//                   size={25}
//                   color={textColorClass}
//                 />
//               </TouchableOpacity>
//             )}

//             {/* Botón Play/Pause/Loading */}
//             <TouchableOpacity
//               onPress={() => togglePlay()}
//               disabled={showLoading} // Desactivado si está cargando o en buffering
//               // disabled={isPlayerLoading}
//             >
//               <View className=" bg-white rounded-full h-14 w-14 items-center justify-center ">
//                 {showLoading ? (
//                   <ActivityIndicator size="small" color="#f43f5e" />
//                 ) : (
//                   <Ionicons
//                     // 1. ¿Está cargando?
//                     name={
//                       showLoading
//                         ? "refresh-circle" // Si está cargando, muestra un icono de carga/refresh
//                         : isPlaying // 2. Si no está cargando, ¿está reproduciendo activamente?
//                           ? "pause-circle" // Si está reproduciendo, muestra pausa
//                           : "play-circle" // Muestra reproducir (pausado o detenido) 3. Si no está cargando y no está reproduciendo
//                     }
//                     size={42}
//                     color="#f43f5e"
//                   />
//                 )}
//               </View>
//             </TouchableOpacity>

//             {isPodcast ? (
//               <TouchableOpacity onPress={handleSkipForward}>
//                 <Ionicons
//                   name="play-skip-forward-circle"
//                   size={34}
//                   color={textColorClass}
//                 />
//               </TouchableOpacity>
//             ) : (
//               <TouchableOpacity onPress={handleClose}>
//                 <Ionicons name="close-circle" size={25} color="#f87171" />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* 🎵 Slider de duración (solo para podcast) */}
//         {isPodcast && (
//           <View className="absolute bottom-0 right-0 left-0 px-4 flex-row items-center justify-center">
//             {/* Tiempo Actual */}
//             {/* 💡 CAMBIO: Usar status.currentTime */}
//             <ThemedText className="text-xs mr-2">
//               {formatTime(isSeeking ? sliderValue : status.currentTime)}
//             </ThemedText>

//             {/* Slider */}
//             <Slider
//               style={{ flex: 1 }}
//               minimumValue={0}
//               maximumValue={status.duration > 0 ? status.duration : 1}
//               step={1}
//               // Muestra el valor del slider si el usuario lo está moviendo, sino el tiempo actual
//               value={isSeeking ? sliderValue : status.currentTime}
//               onValueChange={onSliderValueChange}
//               onSlidingComplete={onSliderSlidingComplete}
//               maximumTrackTintColor="#a0a0a0"
//               minimumTrackTintColor="#a30620"
//               // maximumTrackTintColor="#a0a0a0"
//               thumbTintColor="#fff"
//               // disabled={status.isBuffering || status.duration <= 0}
//             />

//             {/* Duración Total */}
//             {/* 💡 CAMBIO: Usar status.duration */}
//             <ThemedText className="text-xs ml-2">
//               {formatTime(status.duration)}
//             </ThemedText>
//           </View>
//         )}
//       </View>
//     </PlayerBackground>
//   );
// };
// export default memo(AudioPlayer);

// /* Control de Volumen Inferior */
//             <View className="flex-row items-center w-full px-5 space-x-3">
//               {/* Botón Mute / Unmute */}
//               <TouchableOpacity
//                 onPress={() => {
//                   const newVol = volume === 0 ? 0.1 : 0;
//                   setVolume(newVol); // Actualiza el Store/Estado
//                   player.volume = newVol; // Actualiza el Hardware
//                 }}
//               >
//                 <Ionicons
//                   name={volume === 0 ? "volume-off" : "volume-mute"}
//                   size={24}
//                   color={volume === 0 ? "#f43f5e" : "white"}
//                 />
//               </TouchableOpacity>
//               <Slider
//                 style={{ flex: 1 }}
//                 minimumValue={0}
//                 maximumValue={1}
//                 value={player.volume}
//                 onValueChange={(v) => (player.volume = v)}
//                 minimumTrackTintColor="white"
//                 maximumTrackTintColor="rgba(255,255,255,0.3)"
//               />
//               {/* Icono de Volumen Máximo (Subir a 1) */}
//               <TouchableOpacity onPress={() => (player.volume = 1)}>
//                 <Ionicons
//                   name="volume-high"
//                   size={20}
//                   color="rgba(255,255,255,0.5)"
//                 />
//               </TouchableOpacity>
//             </View>
