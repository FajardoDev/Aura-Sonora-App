import { useRegisterLatestView } from "@/core/radio-podcast/actions/radio-podcast/hooks/useRegisterLatestView";
import { useToggleFavorite } from "@/core/radio-podcast/actions/radio-podcast/hooks/useToggleFavorite";
import {
  EntityType,
  Station,
} from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import { ShareButton } from "@/presentation/components/ShareButton";
import ThemedText from "@/presentation/theme/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import { RatingStars } from "./RatingStars";
// import Animated from "react-native-reanimated";

interface Props {
  emisora: Station;
  index?: number;
  fullWidth?: boolean;
}

export default function RadioGridItem({
  emisora,
  index = 0,
  fullWidth,
}: Props) {
  const { streamUrl, isPlaying, setStream, togglePlay } = useAudioPlayerStore();

  const { status, user } = useAuthStore();
  const { mutate: registerView } = useRegisterLatestView();

  const router = useRouter();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  // 1. Inicializar el hook de mutación
  const { mutate, isPending } = useToggleFavorite();
  // const { favorites, isLoading, toggleFavorite } = useFavoritesStore();
  // const isFavorites = favorites.some((f) => f.radioStationId === emisora.id);

  const [activated, setActivated] = useState(false); // 🔹 estado local por card

  const isCurrentStation = streamUrl === emisora.stream;

  // 💡 PASO DE DEBUGGING: Monitorear cuándo cambia la prop 'emisora'
  // useEffect(() => {
  // 	// Si el estado es true, el log debe aparecer INSTANTÁNEAMENTE al hacer clic.
  // 	if (emisora.isFavorite) {
  // 		console.log(
  // 			`[DEBUG - ITEM ${index}] Emisora ${emisora.radioname} es ahora FAVORITA. ¡INSTANTÁNEO!`,
  // 		);
  // 	} else {
  // 		console.log(
  // 			`[DEBUG - ITEM ${index}] Emisora ${emisora.radioname} es NO FAVORITA.`,
  // 		);
  // 	}
  // }, [emisora.isFavorite, index, emisora.radioname]);
  // // Nota: El useEffect solo se dispara cuando isFavorite cambia.

  // 2. Función para construir el payload y llamar a la mutación

  //!🎈
  // useEffect(() => {
  // 	const checkStatus = async () => {
  // 		// Si ya lo tienes en store, no consultes al backend
  // 		const isFavLocal = favorites.some((f) => f.radioStationId === emisora.id);
  // 		if (isFavLocal) return setIsFavorite(true);

  // 		// Caso contrario, verifica en backend
  // 		const { isFavorite } = await getFavoriteStatus({
  // 			type: "radio",
  // 			radioStationId: emisora.id,
  // 		});

  // 		setIsFavorite(isFavorite);
  // 	};

  // 	checkStatus();
  // }, [emisora.id]);

  // const handleToggleFavorite = async () => {
  // 	if (!emisora || isLoading) return;

  // 	const payload = {
  // 		type: "radio" as EntityType,
  // 		radioStationId: emisora.id,
  // 		radioSlug: emisora.slug,
  // 	};

  // 	console.log(payload);

  // 	await toggleFavorite(payload); // ← se maneja en la store (Zustand)
  // };

  // 🧠 Cargar estado del favorito

  //🎈
  const handleToggleFavorites = () => {
    const payload = {
      type: "radio" as EntityType,
      radioStationId: emisora.id,
      radioSlug: emisora.slug,
    };
    console.log(`[LOG] Iniciando mutación optimista para ID: ${emisora.id}`);
    mutate(payload);
  };

  useEffect(() => {
    if (!isCurrentStation && activated) {
      setActivated(false);
    }
  }, [isCurrentStation, activated]);

  const handlePlayClick = () => {
    if (isCurrentStation) {
      // Si es la misma emisora → alternar play/pause
      togglePlay();
    } else {
      // Si es otra → configurar nueva emisora
      setStream(
        emisora.stream,
        emisora.radioname,
        emisora.radioimg,
        emisora.slug,
        emisora.radioid,
        emisora.id,
        // emisora.isFavorite,
        "radio" //!MODIFIQUEE
      );

      if (user && status === "authenticated" && streamUrl !== emisora.stream) {
        try {
          // Registrar la última vista
          registerView({
            type: "radio",
            radioStationId: emisora.id,
          });
        } catch (error) {
          console.error("Error al registrar reproducción:", error);
        }
      }
      setActivated(true);
    }
  };

  const handlePress = () => {
    const targetPath = `/radio-station/${emisora.slug}/#comments`;

    // Evita volver a cargar la misma ruta o tocar varias veces
    if (isNavigating || pathname === targetPath) return;

    setIsNavigating(true);
    router.push(targetPath as any);

    // Bloquea clics por 1 segundo
    setTimeout(() => setIsNavigating(false), 1000);
  };

  // ✅ 2. Toggle seguro con bloqueo para evitar duplicados
  // const handleToggleFavorite = async () => {
  // 	if (isLoading) return; // Evita spam de clics

  // 	const payload = {
  // 		type: "radio" as EntityType,
  // 		radioStationId: emisora.id,
  // 		radioSlug: emisora.slug,
  // 	};

  // 	await toggleFavorite(payload);
  // };

  // Condición para mostrar el icono flotante: Si es la estación actual O si acaba de ser clickeada
  const shouldShowButton = isCurrentStation || activated;

  const uri = emisora.radioimg;

  return (
    <View
      style={{
        width: "30%",
        margin: 5,
        // backgroundColor: "#fff",
        backgroundColor: "#011016",
        borderRadius: 12,
        shadowColor: "#000",
        boxShadow: "2px 2px 5px #011016",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Contenedor de imagen */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePlayClick}
        style={{ position: "relative" }}
      >
        {/* Imagen de la emisora */}
        {/* <Image
					className="shadow-lg shadow-black"
					source={
						emisora.radioimg
							? { uri: emisora.radioimg }
							: require("../../../assets/images/radio-studio.jpg")
					}
					style={{
						width: "100%",
						height: 65,
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,
						resizeMode: "cover",
						opacity: isCurrentStation && isPlaying ? 0.25 : 1,
					}}
				/> */}

        <Image
          source={
            emisora.radioimg
              ? { uri, cache: "force-cache" }
              : require("../../../assets/images/radio-studio.jpg")
          }
          // className="h-20 w-20 rounded-full object-cover mb-2"
          style={{
            // width: "100%",
            // height: 65,
            width: "100%",
            height: 70,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderBottomLeftRadius: 10,
            opacity: isCurrentStation && isPlaying ? 0.25 : 1,
          }}
          contentFit="cover" // mejor que resizeMode
          transition={500} // fade suave al cargar
          placeholder={require("../../../assets/images/radios.png")} // opcional
          priority="high" // alta prioridad de carga
        />

        {/* 🎧 Botón de play/pausa centrado */}
        {shouldShowButton && (
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: [{ translateX: -25 }, { translateY: -25 }],
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: 999,
              padding: 1,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.3,
              shadowRadius: 5,
              zIndex: 10,
            }}
          >
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle-outline"}
              size={45}
              color="#ef4444"
            />
          </View>
        )}

        {/* ❤️ Botón de favoritos arriba a la derecha */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleToggleFavorites} // Llama a la función de toggle
          disabled={isPending} // Deshabilitar mientras la mutación está en curso (opcional)
          style={{
            position: "absolute",
            top: 0,
            right: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 999,
            padding: 6,
            zIndex: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name={emisora.isFavorite ? "heart" : "heart-outline"}
            size={18}
            color="#ef4444"
          />
        </TouchableOpacity>

        {/* Compartir */}
        <ShareButton
          // className="absolute bg-black/70 rounded-full p-1 top-1 left-1 z-20"
          title={`Escucha ${emisora.radioname}`}
          description="Sintoniza tu emisora favorita en vivo."
          url={`exp://192.168.100.58:8081/radio-station/${emisora.slug}`}
          // url={`https://tudominio.com/radio-station/${emisora.slug}`}
        />
      </TouchableOpacity>

      {/* Detalles de la emisora */}
      <TouchableOpacity
        onPress={handlePress}
        style={{
          paddingTop: 5,
          paddingBottom: 5,
          backgroundColor: "#0c0c0cdf",
          width: 125,
          // backgroundColor: "#f9fafb",
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      >
        <View className="p-1">
          <ThemedText
            numberOfLines={1}
            className="text-white font-Roboto-SemiBold  mb-1"
            // style={styles.titleText}
          >
            {emisora.radioname}
          </ThemedText>

          <ThemedText
            numberOfLines={2}
            // style={styles.titleText}
            className="text-xs leading-tight text-rose-500"
          >
            «Radio en vivo»
          </ThemedText>
        </View>

        {emisora.commentsCount > 0 && (
          <View className="flex-row mx-[4px] items-center">
            <ThemedText className="text-sm text-white pr-[2px]">
              {emisora.averageRating.toFixed(1)}
            </ThemedText>
            <RatingStars
              rating={emisora.averageRating}
              commentsCount={emisora.commentsCount}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

/*

const [isFavorite, setIsFavorite] = useState(false);
	useEffect(() => {
		const fetchStatus = async () => {
			const localFav = favorites.some((f) => f.radioStationId === emisora.id);
			if (localFav) return setIsFavorite(true);

			const { isFavorite } = await getFavoriteStatus({
				type: "radio" as EntityType,
				radioStationId: emisora.id,
			});

			setIsFavorite(isFavorite);
		};

		fetchStatus();
	}, [emisora.id]);

	// ❤️ Toggle
	const handleToggleFavorite = async () => {
		const payload = {
			type: "radio" as EntityType,
			radioStationId: emisora.id,
			radioSlug: emisora.slug,
		};

		await toggleFavorite(payload);
		setIsFavorite((prev) => !prev); // Actualiza visualmente sin recargar
	};
















import { Station } from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import ThemedText from "@/presentation/theme/components/themed-text";
import {
	Dimensions,
	Image,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
// import Animated from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface Props {
	emisora: Station;
	index?: number;
	fullWidth?: boolean;
	onPlayPress?: (station: Station) => void;
}

const CARD_MARGIN = 6;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function RadioGridItem({
	emisora,
	index = 0,
	fullWidth,
	onPlayPress,
}: Props) {
	const [showPlay, setShowPlay] = useState(false);

	// const CARD_MARGIN = 6;
	// const SCREEN_WIDTH = Dimensions.get("window").width;

	// // ✅ Se calcula una sola vez y no se vuelve a renderizar
	// const CARD_WIDTH = useMemo(() => {
	// 	return (SCREEN_WIDTH - CARD_MARGIN * 2 * 3) / 3;
	// }, [SCREEN_WIDTH]);

	// const CARD_MARGIN = 6;
	// const SCREEN_WIDTH = Dimensions.get("window").width;
	// const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 * 3) / 3; // 3 columnas con margen

	const streamUrl = "";
	const isPlaying = "";

	const handlePress = () => {
		setShowPlay(true); // muestra el botón
		onPlayPress!(emisora as any); // reproduce la emisora
	};

	return (
		<View
			// entering={FadeInUp.delay(index * 100)
			// 	.duration(500)
			// 	.springify()
			// 	.damping(12)}
			style={{
				flex: fullWidth ? undefined : 1, // flex: 1,
				width: fullWidth ? "50%" : undefined,
				// width: fullWidth ? "100%" : CARD_WIDTH,
				// marginBottom: CARD_MARGIN * 2,
				backgroundColor: "#fff",
				borderRadius: 12,
				margin: 6,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.15,
				shadowRadius: 4,
				elevation: 3,
			}}
		>
			<TouchableOpacity
				activeOpacity={0.85}
				style={[
					styles.touchable,
					isPlaying && streamUrl === emisora.stream
						? styles.activeShadow
						: styles.inactiveShadow,
				]}
				onPress={handlePress} // tocar la card activa el botón
				// onPress={() => router.push(`./radio-station/${emisora.slug}`)}
				// onPress={() => onPlayPress(emisora)}
			>
				<Image
					source={
						emisora.radioimg
							? { uri: emisora.radioimg }
							: require("../../../assets/images/radio-studio.jpg")
					}
					className={`w-full object-fill mb-2 rounded transition-opacity duration-200 ${
						isPlaying && streamUrl === emisora.stream
							? "opacity-20 shadow-lg shadow-gray-200/80"
							: "group-hover:opacity-20"
					}`}
					style={{
						width: "100%",
						height: fullWidth ? 95 : 95, //  50 : 50 2pantalla
						// height: fullWidth ? 85 : 85, //  50 : 50 2pantalla
						borderTopLeftRadius: 12,
						borderTopRightRadius: 12,
						resizeMode: "cover",
					}}
				/>

			
				{showPlay && (
					<View style={styles.playButtonOverlay}>
						<View
							style={[
								styles.playButton,
								isPlaying && streamUrl === emisora.stream
									? styles.playButtonActive
									: null,
							]}
						>
							<Ionicons
								name={
									isPlaying && streamUrl === emisora.stream
										? "pause-circle-outline"
										: "play-circle-outline"
								}
								size={42}
								color="#ef4444"
							/>
						</View>
					</View>
				)}

				<View
					style={{
						paddingVertical: 8,
						paddingHorizontal: 6,
						backgroundColor: "#f9fafb",
						borderBottomLeftRadius: 12,
						borderBottomRightRadius: 12,
					}}
				>
					<ThemedText
						numberOfLines={1}
						style={{
							textAlign: "center",
							fontWeight: "600",
							color: "#1e293b",
						}}
					>
						{emisora.radioname}
					</ThemedText>
				</View>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	cardContainer: {
		margin: CARD_MARGIN,
		borderRadius: 12,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 3,
		elevation: 3,
	},
	touchable: {
		borderRadius: 12,
		overflow: "hidden",
		backgroundColor: "#fff",
	},
	image: {
		width: "100%",
		height: 95,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
	},
	playButtonOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	playButton: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "rgba(255,255,255,0.9)",
		alignItems: "center",
		justifyContent: "center",
		elevation: 4,
	},
	playButtonActive: {
		backgroundColor: "#fff",
		elevation: 6,
	},
	footer: {
		paddingVertical: 8,
		paddingHorizontal: 6,
		backgroundColor: "#f9fafb",
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
	},
	title: {
		textAlign: "center",
		fontWeight: "600",
		color: "#1e293b",
		fontSize: 13,
	},
	activeShadow: {
		shadowColor: "#ef4444",
	},
	inactiveShadow: {
		shadowColor: "#9ca3af",
	},
});

// export default function RadioGridItem({ emisora }: Props) {
// 	return (
// 		<View className="flex-1 bg-light-tabIconDefault dark:bg-dark-tabIconDefault rounded-md py-0  px-0  m-[6px] shadow-black grid grid-cols-3 ">
// 			<TouchableOpacity
// 				onPress={() => router.push(`./radio-station/${emisora.slug}`)}
// 			>
// 				{/* {emisora.radioimg.length === 0 ? (
// 					<Image
// 						source={require("../../../assets/images/no-product-image.png")}
// 						style={{ width: "100%", height: 200 }}
// 					/>
// 				) : (
// 					<Image
// 						source={{ uri: emisora.radioimg }}
// 						style={{ flex: 1, height: 200, width: "100%" }}
// 					/>
// 				)} 
// 				<Image
// 					source={{ uri: emisora.radioimg }}
// 					style={{ flex: 1, height: 75, width: "100%" }}
// 					className="rounded-t-md"
// 					// className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 sm:gap-4 md:gap-5 mt-5 mb-24 max-w-[1024px] mx-auto"
// 				/>

// 				<ThemedText
// 					numberOfLines={1}
// 					className="text-center text-light-text dark:text-dark-text bg-light-background dark:bg-dark-background p-1 mt-1 rounded-md mb-2 mx-1"
// 					// darkColor={"black"}
// 				>
// 					{emisora.radioname}
// 				</ThemedText>
// 			</TouchableOpacity>
// 		</View>
// 	);
// }


* */
