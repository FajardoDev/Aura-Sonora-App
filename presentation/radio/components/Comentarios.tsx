import { PodcastSectionLayout } from "@/presentation/podcast/components/PodcastSectionList";
import { RatingStars } from "./RatingStars";
import { useAuthNavigation } from "@/presentation/auth/hooks/useAuthNavigation";
/* eslint-disable react/display-name */
import { useCommentMutations } from "@/core/radio-podcast/actions/radio-podcast/hooks/useCommentMutations";
import { LastComment } from "@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { ThemedView } from "@/presentation/theme/components/themed-view";
import { Link, router, usePathname } from "expo-router";
import React, { memo, useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { useComments } from "../hooks/useComments";
import { useAudioPlayerStore } from "../store/useAudioPlayerStore";
import ComentariosForm from "./ComentariosForm";
import ComentariosList from "./ComentariosList";

interface ComentariosProps {
  type: "radio" | "podcast";
  entityId: string;
  // initialComments?: LastComment[];
  title?: string;
  cantidad: number;
  averageRating?: number;
  sectionLayout?: PodcastSectionLayout;
}

const Comentarios: React.FC<ComentariosProps> = memo(
  ({ type, entityId, title, cantidad, averageRating = 0, sectionLayout }) => {
    const [writingReview, setWritingReview] = useState(false);
    const { status, user, setLastRoute } = useAuthStore();
    const pathname = usePathname();
    const { requestLogin } = useAuthNavigation();

    const { clearStream } = useAudioPlayerStore();

    // 🚀 Usamos el hook useComments
    const { commentsQuery, allComments, loadNextPage, hasNextPage } =
      useComments(type, entityId);

    const {
      createCommentMutation,
      updateCommentMutation,
      deleteCommentMutation,
    } = useCommentMutations(type, entityId);

    // 1. CREAR COMENTARIO
    const handleSubmitComment = (content: string, rating: number) => {
      createCommentMutation.mutate({ content, rating });
    };

    // 2. ACTUALIZAR COMENTARIO
    const handleUpdateComment = (
      id: string,
      content: string,
      rating: number
    ) => {
      updateCommentMutation.mutate({ id, content, rating });
    };

    // 3. ELIMINAR COMENTARIO
    const handleDeleteComment = (id: string) => {
      deleteCommentMutation.mutate({ id });
    };

    // Usuario no autenticado
    const handleSend = async () => {
      if (status !== "authenticated") {
        clearStream(); // 💥 detiene y limpia antes de ir al login
        await setLastRoute(pathname); // guarda la ruta actual
        router.push("./auth/login/index"); // redirige al login
        return;
      }
    };

    // Usuario no autenticado
    // const handleSend = async () => {
    // 	if (status !== "authenticated") {
    // 		try {
    // 			// 💥 1️⃣ Detenemos y limpiamos el audio ANTES de salir
    // 			// await clearStream();

    // 			// 🕒 2️⃣ Esperamos unos milisegundos para asegurar desmontaje completo
    // 			await new Promise((resolve) => setTimeout(resolve, 150));

    // 			// 💾 3️⃣ Guardamos la ruta actual para volver luego
    // 			await setLastRoute(pathname);

    // 			// 🚀 4️⃣ Redirigimos al login
    // 			router.push("/auth/login/login");
    // 		} catch (error) {
    // 			console.error("Error al limpiar el audio antes de ir al login:", error);
    // 		}
    // 		return;
    // 	}
    // };

    // 💡 Cargando inicial (bloquea la UI)
    if (commentsQuery.isLoading && !sectionLayout) {
      return (
        <ThemedView style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator color={"#f43f5e"} />
          <ThemedText>Cargando comentarios...</ThemedText>
        </ThemedView>
      );
    }

    // 💡 Manejo de error
    if (commentsQuery.isError && !sectionLayout) {
      return (
        <ThemedView style={{ padding: 20, alignItems: "center" }}>
          <ThemedText style={{ color: "red" }}>
            Error: No se pudieron cargar los comentarios.
          </ThemedText>
        </ThemedView>
      );
    }

    const intro = <ThemedView className={sectionLayout ? "mt-6 px-4" : undefined}>
        <ThemedText className="text-white font-semibold mb-3 text-lg">
          <ThemedText>Opiniones sobre</ThemedText>{" "}
          <ThemedText className="text-rose-500">
            {type === "radio" ? `la emisora ${title}` : `el podcast ${title}`}
          </ThemedText>
        </ThemedText>

        {sectionLayout && cantidad > 0 && <ThemedView className="flex-row items-center mb-3">
          <RatingStars rating={averageRating} commentsCount={cantidad} />
          <ThemedText className="ml-2 text-zinc-400">{averageRating.toFixed(1)} de 5</ThemedText>
        </ThemedView>}

        {status === "authenticated" ? (
          !sectionLayout || writingReview ? <ComentariosForm onSubmit={handleSubmitComment} /> :
            <TouchableOpacity accessibilityRole="button" onPress={() => setWritingReview(true)}
              className="bg-rose-500 py-3 px-4 rounded-xl mb-3 self-start">
              <ThemedText className="text-white font-semibold">Escribir opinión</ThemedText>
            </TouchableOpacity>
        ) : (
          <Link
            href="/auth/login"
            onPress={(event) => { event.preventDefault(); requestLogin(); }}
            // onPress={handleSend}
            // onPress={() => router.push("/auth/login/login")}
            className="bg-rose-500 py-2 px-4 rounded-xl mb-3 w-56"
          >
            <ThemedText className="text-white text-center">
              Inicia sesión para comentar
            </ThemedText>
          </Link>
        )}

        {!sectionLayout && <ThemedText className="text-lg">Comentarios: {cantidad}</ThemedText>}
        {sectionLayout && commentsQuery.isLoading && <ActivityIndicator color="#f43f5e" />}
        {sectionLayout && commentsQuery.isError && <ThemedText onPress={() => commentsQuery.refetch()} className="text-rose-500 my-4">No se pudieron cargar las opiniones. Toca para reintentar.</ThemedText>}

    </ThemedView>;

    if (sectionLayout) return <ComentariosList
      comments={allComments as LastComment[]} onUpdate={handleUpdateComment} onDelete={handleDeleteComment}
      currentUserId={user?.id} type={type} entityId={entityId}
      loadNextPage={loadNextPage} isFetchingNextPage={commentsQuery.isFetchingNextPage}
      hasNextPage={hasNextPage} sectionLayout={sectionLayout} intro={intro}
      loading={commentsQuery.isLoading || commentsQuery.isError}
    />;

    return (
      <ThemedView className="mt-6 px-4">
        {intro}

        <ThemedView className="mb-10">
          <ComentariosList
            // comments={comments}

            comments={allComments as LastComment[]}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
            currentUserId={user?.id}
            type={type} // Necesario para el QueryKey
            entityId={entityId} // Necesario para el QueryKey
            loadNextPage={loadNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage} // Estado del loader
            hasNextPage={hasNextPage} // Estado de paginación
          />
        </ThemedView>
      </ThemedView>
    );
  }
);

export default Comentarios;

/*

	 🚀 BOTÓN DE CARGAR MÁS CON ACTIVIVITY INDICATOR
				{/* {hasNextPage && (
					<Pressable
						disabled={commentsQuery.isFetchingNextPage} // 💡 Desactiva si ya está cargando la siguiente página
						onPress={() => loadNextPage()} // 💡 Llama a la función del hook
						className="mt-4 bg-gray-800 py-2 rounded-xl"
					>
						{commentsQuery.isFetchingNextPage ? ( // 💡 Usamos isFetchingNextPage para el loader
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-center text-white">Cargar más comentarios</Text>
						)}
					</Pressable>
				)} 

				 {meta.totalPages > page && (
					<Pressable
						disabled={loading}
						onPress={() => {
							const nextPage = page + 1;
							setPage(nextPage);
							handleFetchComments(nextPage);
						}}
						className="mt-4 bg-gray-800 py-2 rounded-xl"
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-center text-white">Cargar más comentarios</Text>
						)}
					</Pressable>
				)} 




Funciona 
// 📝 Crear comentario
		const handleSubmitComment = async (content: string, rating: number) => {
			const newComment = await createComment(
				{
					content,
					rating,
					radioStationId: type === "radio" ? entityId : null,
					podcastId: type === "podcast" ? entityId : null,
				},
				type,
				entityId,
			);

			// ✅ Añadir comentario nuevo al principio de la lista
			setComments((prev) => [newComment, ...prev]);
		};

		// ✏️ Actualizar comentario
		const handleUpdateComment = useCallback(
			async (id: string, content: string, rating: number) => {
				try {
					const updated = await updateComment(id, { content, rating });
					setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
				} catch (error) {
					console.error(error);
				}
			},
			[],
		);

		// 🗑️ Eliminar comentario
		const handleDeleteComment = useCallback(async (id: string) => {
			try {
				await deleteComment(id);
				setComments((prev) => prev.filter((c) => c.id !== id));
			} catch (error) {
				console.error(error);
			}
		}, []);





📝 Crear comentario
		const handleSubmitComment = useCallback(
			async (content: string, rating: number) => {
				if (!user) return;

				try {
					const newComment = await createComment(type, entityId, {
						content,
						rating,
						userId: user.id,
					});

					setComments((prev) => [newComment, ...prev]);
				} catch (error) {
					console.error(error);
				}
			},
			[type, entityId, user],
		);

import { LastComment } from "@/core/radio-podcast/interface/radio/radio-station-responce-by-slug.interface";
import { useAuthStore } from "@/presentation/auth/store/useAuthStore";
import ThemedText from "@/presentation/theme/components/themed-text";
import { router } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import ComentariosForm from "./ComentariosForm";
import ComentariosList from "./ComentariosList";

interface ComentariosProps {
	type: "radio" | "podcast";
	entityId: string;
	initialComments?: LastComment[];
	title?: string;
}

const Comentarios: React.FC<ComentariosProps> = memo(
	({ type, entityId, title, initialComments = [] }) => {
		const { status, user } = useAuthStore();
		const [comments, setComments] = useState<LastComment[]>(initialComments);
		const [page, setPage] = useState(1);
		const [loading, setLoading] = useState(false);
		const [meta, setMeta] = useState<{ totalPages: number }>({ totalPages: 1 });

		const API_URL = process.env.EXPO_PUBLIC_API_URL;

		 📡 Fetch comments (paginado)
		const fetchComments = useCallback(
			async (pageToLoad: number = 1) => {
				try {
					setLoading(true);
					const url =
						type === "radio"
							? `${API_URL}/comments/radio-station/${entityId}?page=${pageToLoad}&limit=10`
							: `${API_URL}/comments/podcastrd/${entityId}?page=${pageToLoad}&limit=10`;

					const response = await fetch(url);
					const data = await response.json();

					if (pageToLoad === 1) {
						setComments(data.comments);
					} else {
						setComments((prev) => [...prev, ...data.comments]);
					}

					setMeta({ totalPages: data.meta.totalPages });
				} catch (error) {
					console.error("❌ Error al cargar comentarios:", error);
				} finally {
					setLoading(false);
				}
			},
			[API_URL, entityId, type],
		);

		useEffect(() => {
			fetchComments(1);
		}, [fetchComments]);

		 📝 Crear comentario
		const handleSubmitComment = useCallback(
			async (content: string, rating: number) => {
				if (!user) return;
				try {
					const payload = {
						content,
						rating,
						userId: user.id,
						radioStationId: type === "radio" ? entityId : null,
						podcastId: type === "podcast" ? entityId : null,
					};

					const response = await fetch(`${API_URL}/comments`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					});

					if (!response.ok) throw new Error("Error al crear comentario");

					const newComment = await response.json();
					setComments((prev) => [newComment, ...prev]);
				} catch (error) {
					console.error("❌ Error al enviar comentario:", error);
				}
			},
			[API_URL, type, entityId, user],
		);

		 ✏️ Actualizar comentario
		const handleUpdateComment = useCallback(
			async (id: string, content: string, rating: number) => {
				try {
					const response = await fetch(`${API_URL}/comments/${id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ content, rating }),
					});
					if (!response.ok) throw new Error("Error al actualizar comentario");

					const updated = await response.json();
					setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
				} catch (err) {
					console.error("❌ Error actualizando comentario", err);
				}
			},
			[API_URL],
		);

		// 🗑️ Eliminar comentario
		const handleDeleteComment = useCallback(
			async (id: string) => {
				try {
					const response = await fetch(`${API_URL}/comments/${id}`, {
						method: "DELETE",
					});
					if (!response.ok) throw new Error("Error al eliminar comentario");

					setComments((prev) => prev.filter((c) => c.id !== id));
				} catch (err) {
					console.error("❌ Error eliminando comentario", err);
				}
			},
			[API_URL],
		);

		return (
			<View className="mt-6 px-4">
				<ThemedText type="semi-bold" className="text-white font-semibold mb-3">
					Opiniones sobre{" "}
					<Text className="text-rose-500">
						{type === "radio" ? `la emisora ${title}` : "este podcast"}
					</Text>
				</ThemedText>

				{status === "authenticated" ? (
					<ComentariosForm onSubmit={handleSubmitComment} />
				) : (
					<Pressable
						onPress={() => router.push("./auth/login/login")}
						className="bg-rose-500 py-2 px-4 rounded-xl mb-3 w-56"
					>
						<Text className="text-white text-center">
							Inicia sesión para comentar
						</Text>
					</Pressable>
				)}

				<ComentariosList
					comments={comments}
					onUpdate={handleUpdateComment}
					onDelete={handleDeleteComment}
					currentUserId={user?.id}
				/>

				 Botón cargar más 
				{meta.totalPages > page && (
					<Pressable
						disabled={loading}
						onPress={() => {
							const nextPage = page + 1;
							setPage(nextPage);
							fetchComments(nextPage);
						}}
						className="mt-4 bg-gray-800 py-2 rounded-xl"
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-center text-white">Cargar más comentarios</Text>
						)}
					</Pressable>
				)}
			</View>
		);
	},
);

export default Comentarios;



* */
