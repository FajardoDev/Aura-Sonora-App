import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { extractDirectAudioLink } from "@/utils/urlEpisodes";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, TouchableOpacity, View } from "react-native";

interface Props {
  urls: string[];
  title: string;
  podcastTitle?: string;
  image?: string;
  episodeId: string;
  description: string;
}

export const EpisodeDownloadButton: React.FC<Props> = ({
  urls,
  title,
  podcastTitle,
  image,
  episodeId,
  description,
}) => {
  const {
    downloads,
    addDownload,
    downloadingIds,
    markAsDownloading,
    unmarkAsDownloading,
    getDownloadedEpisode,
  } = useDownloadsStore();

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const isDownloading = downloadingIds.includes(episodeId);
  const downloaded = getDownloadedEpisode(episodeId);

  useEffect(() => {
    const mp3Url = extractDirectAudioLink(urls);
    const existing = downloads.find(
      (d) => d.title === title || d.uri.includes(mp3Url ?? "")
    );
    setIsDownloaded(!!existing);
  }, [downloads, urls, title]);

  // 💾 Manejar descarga con progreso
  const handleDownload = async () => {
    const info = await FileSystem.getFreeDiskStorageAsync();

    try {
      if (info < 50 * 1024 * 1024) {
        // menos de 50MB libres
        Alert.alert(
          "Poco espacio disponible",
          "Tu dispositivo tiene poco espacio libre. Libera espacio antes de descargar este episodio."
        );
        return;
      }

      const mp3Url = extractDirectAudioLink(urls);
      const firstUrl = urls[0];

      if (!mp3Url && !firstUrl) {
        Alert.alert(
          "Sin enlace",
          "No hay un enlace disponible para este episodio."
        );
        return;
      }

      if (mp3Url) {
        const filename =
          title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mp3";
        const fileUri = FileSystem.documentDirectory + filename;

        markAsDownloading(episodeId);
        setProgress(0);

        const downloadResumable = FileSystem.createDownloadResumable(
          mp3Url,
          fileUri,
          {},
          (downloadProgress) => {
            const progressPercent =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setProgress(progressPercent);
          }
        );

        // const { uri } = await downloadResumable.downloadAsync();
        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult || !downloadResult.uri) {
          throw new Error("La descarga no se completó correctamente.");
        }
        const { uri } = downloadResult;
        // const img = getImageUrl(image);

        await addDownload({
          id: episodeId,
          title,
          uri,
          podcastTitle,
          image,
          description,
        });

        Alert.alert(
          "Descarga completa",
          `El episodio se guardó en tu lista 🎧`
        );
      } else {
        Alert.alert(
          "Abrir en navegador",
          "Serás redirigido a una página donde podrás escuchar o descargar el episodio.",
          [
            { text: "Abrir", onPress: () => Linking.openURL(firstUrl) },
            { text: "Cancelar", style: "cancel" },
          ]
        );
      }
    } catch (error: any) {
      console.log("❌ Error al descargar:", error);

      if (error?.message?.includes("No space left on device")) {
        Alert.alert(
          "Espacio insuficiente",
          "Tu dispositivo no tiene suficiente espacio para descargar este episodio. Libera espacio e inténtalo de nuevo."
        );
      } else if (error?.message?.includes("ENOSPC")) {
        Alert.alert(
          "Almacenamiento lleno",
          "Parece que tu almacenamiento interno está lleno. Elimina archivos innecesarios y vuelve a intentarlo."
        );
      } else if (error?.message?.includes("Permission denied")) {
        Alert.alert(
          "Permisos requeridos",
          "La aplicación no tiene permiso para guardar archivos. Verifica los permisos de almacenamiento."
        );
      } else {
        Alert.alert(
          "Error al descargar",
          "No se pudo completar la descarga. Verifica tu conexión o el espacio disponible."
        );
      }

      // console.log("❌ Error al descargar:", error);
      // Alert.alert("Error", "No se pudo descargar el episodio.");
    } finally {
      unmarkAsDownloading(episodeId);
      setProgress(0);
    }
  };

  const handleOpenLocal = () => {
    Alert.alert(
      "Descargado 🎧",
      "Este episodio ya está guardado en tu dispositivo.",
      [
        {
          text: "Reproducir offline",
          onPress: () => {
            // aquí puedes usar setStream(download.uri, ...) si lo deseas
          },
        },
        { text: "Cerrar", style: "cancel" },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={isDownloaded ? handleOpenLocal : handleDownload}
      activeOpacity={0.5}
      className={`flex-row items-center px-4 py-1.5 rounded-full border ${
        isDownloaded
          ? "bg-green-500/10 border-green-500/50"
          : "bg-red-500/5 border-red-500/10"
      }`}
      disabled={isDownloading || !!downloaded}
    >
      {isDownloading ? (
        <View className="flex-row items-center">
          <ActivityIndicator
            size="small"
            color="#f43f5e"
            style={{ scaleX: 0.8, scaleY: 0.8 }}
          />
          <ThemedText className="ml-2 text-rose-500 text-[11px] font-bold">
            {Math.round(progress * 100)}%
          </ThemedText>
        </View>
      ) : (
        <>
          <Ionicons
            name={isDownloaded ? "checkmark-circle" : "cloud-download-outline"}
            size={16}
            color={isDownloaded ? "#22c55e" : "red"}
          />
          <ThemedText
            className={`ml-2 text-[11px] font-bold tracking-wide uppercase ${
              isDownloaded
                ? "text-green-500"
                : "text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {isDownloaded ? "Guardado" : "Descargar"}
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );

  // return (
  //   <TouchableOpacity
  //     onPress={isDownloaded ? handleOpenLocal : handleDownload}
  //     className={`flex-row items-center p-[5px] rounded-full ${
  //       isDownloaded ? "bg-green-600" : "bg-rose-600/50"
  //     }`}
  //     disabled={isDownloading || !!downloaded}
  //   >
  //     {isDownloading ? (
  //       <View className="flex-row items-center">
  //         <ActivityIndicator size="small" color="#fff" />
  //         <ThemedText className="ml-1 text-white text-xs animate-pulse">
  //           Descargando... {Math.round(progress * 100)}%
  //         </ThemedText>
  //       </View>
  //     ) : (
  //       <>
  //         <Ionicons
  //           name={isDownloaded ? "checkmark-done-outline" : "download-outline"}
  //           size={14}
  //           color="white"
  //         />
  //         <ThemedText className="ml-2 text-white text-sm">
  //           {isDownloaded ? "Descargado" : "Descargar"}
  //         </ThemedText>
  //       </>
  //     )}
  //   </TouchableOpacity>
  // );
};

// import { useDownloadsStore } from "@/presentation/podcast/store/useDownloadsStore";
// import { Ionicons } from "@expo/vector-icons";
// import * as FileSystem from "expo-file-system/legacy";
// import * as Linking from "expo-linking";
// import React from "react";
// import { Alert, Text, TouchableOpacity } from "react-native";

// interface Props {
// 	urls: string[];
// 	title: string;
// 	podcastTitle?: string;
// 	image?: string;
// }

// export const EpisodeDownloadButton: React.FC<Props> = ({
// 	urls,
// 	title,
// 	podcastTitle,
// 	image,
// }) => {
// 	const { addDownload } = useDownloadsStore(); // 👈 Importante

// 	const handleDownload = async () => {
// 		try {
// 			const mp3Url = urls.find((u) => u?.endsWith(".mp3"));
// 			const firstUrl = urls[0];

// 			if (!mp3Url && !firstUrl) {
// 				Alert.alert(
// 					"Sin enlace",
// 					"No hay un enlace disponible para este episodio.",
// 				);
// 				return;
// 			}

// 			if (mp3Url) {
// 				const filename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".mp3";
// 				const fileUri = FileSystem.documentDirectory + filename;

// 				const { uri } = await FileSystem.downloadAsync(mp3Url, fileUri);

// 				// ✅ Guarda en el store local
// 				await addDownload({
// 					id: Date.now().toString(),
// 					title,
// 					uri,
// 					podcastTitle,
// 					image,
// 				});

// 				Alert.alert(
// 					"Descarga completa",
// 					`El episodio se guardó en tu lista de descargas 🎧`,
// 				);
// 			} else {
// 				Alert.alert(
// 					"Abrir en navegador",
// 					"Serás redirigido a una página donde podrás escuchar o descargar el episodio.",
// 					[
// 						{ text: "Abrir", onPress: () => Linking.openURL(firstUrl) },
// 						{ text: "Cancelar", style: "cancel" },
// 					],
// 				);
// 			}
// 		} catch (error: any) {
// 			console.log("❌ Error al descargar:", error);
// 			Alert.alert(
// 				"Error",
// 				"No se pudo descargar el episodio. Intenta abrirlo desde el navegador.",
// 			);
// 		}
// 	};

// 	return (
// 		<TouchableOpacity
// 			onPress={handleDownload}
// 			className="flex-row items-center bg-black/80 px-3 py-1 rounded-full"
// 		>
// 			<Ionicons name="download-outline" size={14} color="white" />
// 			<Text className="ml-2 text-white text-sm">Descargar episodio</Text>
// 		</TouchableOpacity>
// 	);
// };
