/* eslint-disable eqeqeq */
import { HistoryResponse } from "@/core/radio-podcast/interface/radio-podcast/history.interface";
import { Type } from "@/core/radio-podcast/interface/radio-podcast/historys.interface";
import {
	EntityType,
	FavoriteTogglePayload,
	RadioStationResponse,
	Station,
} from "@/core/radio-podcast/interface/radio/radio-station-responce.interface";
import {
	InfiniteData,
	QueryKey,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { togglefavorite } from "../actions/post-toggle-favorites.action";
import { FlatHistoryEntityPage } from "./useHistorys";

export interface NestedEntity {
	slug: string;
	isFavorite: boolean;
	id: string;
}

type InfiniteTransformedData = InfiniteData<FlatHistoryEntityPage[], number>;

/**
 * Retorna la clave base de detalle: 'radioStation' o 'podcast'.
 */
const getDetailBaseKeyName = (type: EntityType): string =>
	type === "radio" ? "radioStation" : "podcast";

export const useToggleFavorite = () => {
	const queryClient = useQueryClient();

	// Claves de consulta de las listas infinitas (ALL)
	const getListQueryKey = (type: EntityType): QueryKey =>
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];

	// Claves de consulta de los FAVORITOS
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// Claves de consulta de las listas por CATEGORÍA (NUEVAS)
	const CATEGORY_RADIO_KEY_BASE: QueryKey = ["radioscat", "infinite"];
	const CATEGORY_PODCAST_KEY_BASE: QueryKey = ["podcastcat", "infinite"];

	const HISTORY_KEY_BASE: QueryKey = ["history", "home"];
	const getHistorysPageQueryKey = (type: EntityType): QueryKey => [
		"historys",
		"page",
		type,
	];

	return useMutation({
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Actualización Optimista (INSTANTÁNEA)
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const entityType = newFavoriteData.type;
			const toggledSlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

			if (!toggledSlug) return;

			const detailBaseKeyName = getDetailBaseKeyName(entityType);
			const detailQueryKey: QueryKey = [detailBaseKeyName, toggledSlug];

			// 1. Cancelar queries pendientes (Buena práctica)
			await queryClient.cancelQueries({ queryKey: [detailBaseKeyName] });

			// 2. Aplicar la actualización Optimista a todas las vistas de detalle en caché.
			// Esto garantiza que el cambio se refleje al instante en la lista de relacionadas
			// en CUALQUIER otra pantalla de detalle que tenga esta estación en su lista.
			queryClient.setQueriesData(
				{ queryKey: [detailBaseKeyName] },
				(cachedData: any) => {
					// Si el dato en caché es la propia página de detalle que estamos viendo
					if (cachedData && cachedData.data?.slug === toggledSlug) {
						return {
							...cachedData,
							data: {
								...cachedData.data,
								isFavorite: !cachedData.data.isFavorite, // Actualiza el corazón del elemento principal
							},
						};
					}

					// Si el dato en caché es CUALQUIER otra página de detalle (donde nuestra estación
					// aparece en la lista de relacionadas)
					if (
						cachedData &&
						cachedData.relatedStations &&
						cachedData.relatedStations.radios
					) {
						const updatedRelated = cachedData.relatedStations.radios.map(
							(station: Station) =>
								station.slug === toggledSlug
									? { ...station, isFavorite: !station.isFavorite } // Actualiza el corazón en la lista de relacionadas
									: station,
						);

						return {
							...cachedData,
							relatedStations: {
								...cachedData.relatedStations,
								radios: updatedRelated,
							},
						};
					}

					return cachedData; // Devolver los datos sin cambios si no hay coincidencia
				},
			);

			queryClient.setQueriesData(
				{ queryKey: getHistorysPageQueryKey(entityType) },
				(cachedData: InfiniteData<FlatHistoryEntityPage[]> | undefined) => {
					// Chequeo ultra-defensivo de la estructura base
					if (!cachedData || !cachedData.pages || cachedData.pages.length === 0) {
						console.warn(
							`[OPTIMISTIC WARNING] No se encontró caché para historial paginado (${entityType}).`,
						);
						return cachedData;
					}

					let found = false;

					const updatedPages = cachedData.pages.map((page) => {
						// Defensa: Asegurar que 'page' es un array (podría ser null/undefined en casos raros)
						const safePage = Array.isArray(page) ? page : [];

						const updatedPage = safePage.map((item) => {
							// Defensa: Chequear que el item existe y tiene el slug
							if (item && item.slug === toggledSlug) {
								found = true;
								// Retornar un NUEVO objeto (inmutabilidad)
								return {
									...item,
									isFavorite: !item.isFavorite, // ✅ Toggle instantáneo
								};
							}
							return item;
						});

						return updatedPage; // Esta es una NUEVA referencia de array
					});

					if (!found) {
						console.warn(
							`[OPTIMISTIC WARNING] No se encontró el slug "${toggledSlug}" en las páginas del historial. Esto es normal si el elemento no está en las páginas cargadas.`,
						);
						return cachedData;
					}

					console.log(
						`[OPTIMISTIC SUCCESS] ✅ Historial paginado actualizado optimistamente (${entityType}).`,
					);

					// *** EL ARREGLO CLAVE: Retornar la nueva estructura InfiniteData ***
					// 'updatedPages' es el nuevo array de páginas (new reference).
					// Al usar el spread operator y sobreescribir 'pages', garantizamos que
					// TanStack Query detecte el cambio de referencia profunda.
					return {
						...cachedData,
						pages: updatedPages, // ASIGNACIÓN CORRECTA: Se usa el nuevo array 'updatedPages' directamente
						// pageParams no se toca si no hay cambios.
					};
				},
			);

			// 🌟🌟🌟 LÓGICA DE ACTUALIZACIÓN OPTIMISTA DEL HISTORIAL (ULTRA-DEFENSIVA) 🌟🌟🌟
			queryClient.setQueryData(
				HISTORY_KEY_BASE,
				(cachedData: HistoryResponse | undefined) => {
					if (!cachedData) return cachedData;

					const listKey = entityType === "radio" ? "radios" : "podcasts";
					const nestedKey = entityType === "radio" ? "radioStation" : "podcast";

					let foundAndToggled = false;

					const updatedList = (
						cachedData[listKey as "radios" | "podcasts"] || []
					).map((item) => {
						const nestedEntity = item[nestedKey as "radioStation" | "podcast"];

						if (nestedEntity && nestedEntity.slug === toggledSlug) {
							foundAndToggled = true;
							// Retornar el elemento inmutable con el cambio
							return {
								...item,
								[nestedKey]: {
									...nestedEntity,
									isFavorite: !nestedEntity.isFavorite, // TOGGLE
								} as NestedEntity,
							};
						}
						return item;
					});

					if (!foundAndToggled) {
						console.warn(
							`[OPTIMISTIC WARNING] ⚠️ No se encontró el slug ${toggledSlug} en la caché del historial.`,
						);
						return cachedData;
					}

					// *** NÚCLEO DE LA SOLUCIÓN: GARANTIZAR NUEVA REFERENCIA PROFUNDA ***
					// Esto clona el objeto para asegurar que React detecte que la data cambió.
					const newHistoryResponse = {
						...cachedData,
						[listKey]: updatedList,
					};

					console.log(
						`[OPTIMISTIC SUCCESS] ✅ Éxito: Historial actualizado y clonado profundamente.`,
					);

					// Clonado profundo para garantizar que la referencia del objeto raíz sea nueva
					return JSON.parse(JSON.stringify(newHistoryResponse));
				},
			);
			// 🌟🌟🌟 FIN LÓGICA OPTIMISTA DEL HISTORIAL 🌟🌟🌟

			// Devolver el contexto para el rollback si falla la mutación
			return { detailBaseKeyName, toggledSlug };
		},

		// 2. Si la mutación falla: (Aquí iría el rollback)
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida. Rollback no implementado.");
		},

		// 3. Después de la mutación: Invalida y fuerza la recarga (en el fondo)
		onSettled: (data, error, newFavoriteData, context) => {
			const listQueryKey = getListQueryKey(newFavoriteData.type);
			const detailBaseKeyName = getDetailBaseKeyName(newFavoriteData.type);
			const HistoryBaseKeyName = getHistorysPageQueryKey(newFavoriteData.type);

			const categoryBaseKey =
				newFavoriteData.type === "radio"
					? CATEGORY_RADIO_KEY_BASE
					: CATEGORY_PODCAST_KEY_BASE;

			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			// A. Invalidar la lista de origen
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// B. Invalidar las listas de favoritos
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });
			queryClient.invalidateQueries({ queryKey: HISTORY_KEY_BASE });
			queryClient.invalidateQueries({ queryKey: HistoryBaseKeyName });

			// C. Invalidar todas las listas de categorías (e.g., ['podcastcat', 'infinite'])
			// Esto forzará la recarga de la lista de categorías que esté visible actualmente.
			queryClient.invalidateQueries({
				queryKey: categoryBaseKey,
				refetchType: "all", // Invalida todas las sub-queries (todas las categorías)
			});

			// 🌟🌟🌟 D. INVALIDACIONES ADICIONALES (Top y Categorías Populares) 🌟🌟🌟
			if (newFavoriteData.type === "radio") {
				queryClient.invalidateQueries({ queryKey: ["topStation"] });
				queryClient.invalidateQueries({ queryKey: ["popularCategoriesStation"] });
			} else if (newFavoriteData.type === "podcast") {
				queryClient.invalidateQueries({ queryKey: ["topPodcast"] });
				queryClient.invalidateQueries({ queryKey: ["popularCategoriesPodcast"] });
			}
			// 🌟🌟🌟 FIN D. INVALIDACIONES ADICIONALES 🌟🌟🌟

			// C. Invalidar la clave BASE del DETALLE para que el useFocusEffect recargue la data
			// y confirme que la actualización optimista fue correcta.
			if (context?.toggledSlug) {
				queryClient.invalidateQueries({
					queryKey: [detailBaseKeyName],
					refetchType: "all",
				});
			}
		},
	});
};





export const useToggleFavoritee = () => {
	const queryClient = useQueryClient();

	// Claves de consulta de las listas infinitas (ALL)
	const getListQueryKey = (type: EntityType): QueryKey =>
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];

	// Claves de consulta de los FAVORITOS
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// Claves de consulta de las listas por CATEGORÍA (NUEVAS)
	const CATEGORY_RADIO_KEY_BASE: QueryKey = ["radioscat", "infinite"];
	const CATEGORY_PODCAST_KEY_BASE: QueryKey = ["podcastcat", "infinite"];

	const HISTORY_KEY_BASE: QueryKey = ["history", "home"];
	const getHistorysPageQueryKey = (type: EntityType): QueryKey => [
		"historys",
		"page",
		type,
	];

	return useMutation({
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Actualización Optimista (INSTANTÁNEA)
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const entityType = newFavoriteData.type;
			const toggledSlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

			if (!toggledSlug) return;

			const detailBaseKeyName = getDetailBaseKeyName(entityType);
			const detailQueryKey: QueryKey = [detailBaseKeyName, toggledSlug];

			// 1. Cancelar queries pendientes (Buena práctica)
			await queryClient.cancelQueries({ queryKey: [detailBaseKeyName] });

			// 2. Aplicar la actualización Optimista a todas las vistas de detalle en caché.
			// Esto garantiza que el cambio se refleje al instante en la lista de relacionadas
			// en CUALQUIER otra pantalla de detalle que tenga esta estación en su lista.
			queryClient.setQueriesData(
				{ queryKey: [detailBaseKeyName] },
				(cachedData: any) => {
					// Si el dato en caché es la propia página de detalle que estamos viendo
					if (cachedData && cachedData.data?.slug === toggledSlug) {
						return {
							...cachedData,
							data: {
								...cachedData.data,
								isFavorite: !cachedData.data.isFavorite, // Actualiza el corazón del elemento principal
							},
						};
					}

					// Si el dato en caché es CUALQUIER otra página de detalle (donde nuestra estación
					// aparece en la lista de relacionadas)
					if (
						cachedData &&
						cachedData.relatedStations &&
						cachedData.relatedStations.radios
					) {
						const updatedRelated = cachedData.relatedStations.radios.map(
							(station: Station) =>
								station.slug === toggledSlug
									? { ...station, isFavorite: !station.isFavorite } // Actualiza el corazón en la lista de relacionadas
									: station,
						);

						return {
							...cachedData,
							relatedStations: {
								...cachedData.relatedStations,
								radios: updatedRelated,
							},
						};
					}

					return cachedData; // Devolver los datos sin cambios si no hay coincidencia
				},
			);

			queryClient.setQueriesData(
				{ queryKey: getHistorysPageQueryKey(entityType) },
				(cachedData: InfiniteData<FlatHistoryEntityPage[]> | undefined) => {
					// Chequeo ultra-defensivo de la estructura base
					if (!cachedData || !cachedData.pages || cachedData.pages.length === 0) {
						console.warn(
							`[OPTIMISTIC WARNING] No se encontró caché para historial paginado (${entityType}).`,
						);
						return cachedData;
					}

					let found = false;

					const updatedPages = cachedData.pages.map((page) => {
						// Defensa: Asegurar que 'page' es un array (podría ser null/undefined en casos raros)
						const safePage = Array.isArray(page) ? page : [];

						const updatedPage = safePage.map((item) => {
							// Defensa: Chequear que el item existe y tiene el slug
							if (item && item.slug === toggledSlug) {
								found = true;
								// Retornar un NUEVO objeto (inmutabilidad)
								return {
									...item,
									isFavorite: !item.isFavorite, // ✅ Toggle instantáneo
								};
							}
							return item;
						});

						return updatedPage; // Esta es una NUEVA referencia de array
					});

					if (!found) {
						console.warn(
							`[OPTIMISTIC WARNING] No se encontró el slug "${toggledSlug}" en las páginas del historial. Esto es normal si el elemento no está en las páginas cargadas.`,
						);
						return cachedData;
					}

					console.log(
						`[OPTIMISTIC SUCCESS] ✅ Historial paginado actualizado optimistamente (${entityType}).`,
					);

					// *** EL ARREGLO CLAVE: Retornar la nueva estructura InfiniteData ***
					// 'updatedPages' es el nuevo array de páginas (new reference).
					// Al usar el spread operator y sobreescribir 'pages', garantizamos que
					// TanStack Query detecte el cambio de referencia profunda.
					return {
						...cachedData,
						pages: updatedPages, // ASIGNACIÓN CORRECTA: Se usa el nuevo array 'updatedPages' directamente
						// pageParams no se toca si no hay cambios.
					};
				},
			);

			// 🌟🌟🌟 LÓGICA DE ACTUALIZACIÓN OPTIMISTA DEL HISTORIAL (ULTRA-DEFENSIVA) 🌟🌟🌟
			queryClient.setQueryData(
				HISTORY_KEY_BASE,
				(cachedData: HistoryResponse | undefined) => {
					if (!cachedData) return cachedData;

					const listKey = entityType === "radio" ? "radios" : "podcasts";
					const nestedKey = entityType === "radio" ? "radioStation" : "podcast";

					let foundAndToggled = false;

					const updatedList = (
						cachedData[listKey as "radios" | "podcasts"] || []
					).map((item) => {
						const nestedEntity = item[nestedKey as "radioStation" | "podcast"];

						if (nestedEntity && nestedEntity.slug === toggledSlug) {
							foundAndToggled = true;
							// Retornar el elemento inmutable con el cambio
							return {
								...item,
								[nestedKey]: {
									...nestedEntity,
									isFavorite: !nestedEntity.isFavorite, // TOGGLE
								} as NestedEntity,
							};
						}
						return item;
					});

					if (!foundAndToggled) {
						console.warn(
							`[OPTIMISTIC WARNING] ⚠️ No se encontró el slug ${toggledSlug} en la caché del historial.`,
						);
						return cachedData;
					}

					// *** NÚCLEO DE LA SOLUCIÓN: GARANTIZAR NUEVA REFERENCIA PROFUNDA ***
					// Esto clona el objeto para asegurar que React detecte que la data cambió.
					const newHistoryResponse = {
						...cachedData,
						[listKey]: updatedList,
					};

					console.log(
						`[OPTIMISTIC SUCCESS] ✅ Éxito: Historial actualizado y clonado profundamente.`,
					);

					// Clonado profundo para garantizar que la referencia del objeto raíz sea nueva
					return JSON.parse(JSON.stringify(newHistoryResponse));
				},
			);
			// 🌟🌟🌟 FIN LÓGICA OPTIMISTA DEL HISTORIAL 🌟🌟🌟

			// Devolver el contexto para el rollback si falla la mutación
			return { detailBaseKeyName, toggledSlug };
		},

		// 2. Si la mutación falla: (Aquí iría el rollback)
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida. Rollback no implementado.");
		},

		// 3. Después de la mutación: Invalida y fuerza la recarga (en el fondo)
		onSettled: (data, error, newFavoriteData, context) => {
			const listQueryKey = getListQueryKey(newFavoriteData.type);
			const detailBaseKeyName = getDetailBaseKeyName(newFavoriteData.type);
			const HistoryBaseKeyName = getHistorysPageQueryKey(newFavoriteData.type);

			const categoryBaseKey =
				newFavoriteData.type === "radio"
					? CATEGORY_RADIO_KEY_BASE
					: CATEGORY_PODCAST_KEY_BASE;

			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			// A. Invalidar la lista de origen
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// B. Invalidar las listas de favoritos
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });
			queryClient.invalidateQueries({ queryKey: HISTORY_KEY_BASE });
			queryClient.invalidateQueries({ queryKey: HistoryBaseKeyName });

			// C. Invalidar todas las listas de categorías (e.g., ['podcastcat', 'infinite'])
			// Esto forzará la recarga de la lista de categorías que esté visible actualmente.
			queryClient.invalidateQueries({
				queryKey: categoryBaseKey,
				refetchType: "all", // Invalida todas las sub-queries (todas las categorías)
			});

			// C. Invalidar la clave BASE del DETALLE para que el useFocusEffect recargue la data
			// y confirme que la actualización optimista fue correcta.
			if (context?.toggledSlug) {
				queryClient.invalidateQueries({
					queryKey: [detailBaseKeyName],
					refetchType: "all",
				});
			}
		},
	});
};

export const useToggleFavoritst = () => {
	const queryClient = useQueryClient();

	// Claves de consulta de las listas infinitas (ALL)
	const getListQueryKey = (type: EntityType): QueryKey =>
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];

	// Claves de consulta de los FAVORITOS
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// Claves de consulta de las listas por CATEGORÍA (NUEVAS)
	const CATEGORY_RADIO_KEY_BASE: QueryKey = ["radioscat", "infinite"];
	const CATEGORY_PODCAST_KEY_BASE: QueryKey = ["podcastcat", "infinite"];

	const HISTORY_KEY_BASE: QueryKey = ["history", "home"];
	const getHistorysPageQueryKey = (type: Type): QueryKey => [
		"history",
		"page",
		type,
	];

	return useMutation({
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Actualización Optimista (INSTANTÁNEA)
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const entityType = newFavoriteData.type;
			const toggledSlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

			if (!toggledSlug) return;

			const detailBaseKeyName = getDetailBaseKeyName(entityType);
			const detailQueryKey: QueryKey = [detailBaseKeyName, toggledSlug];

			// 1. Cancelar queries pendientes (Buena práctica)
			await queryClient.cancelQueries({ queryKey: [detailBaseKeyName] });

			// 2. Aplicar la actualización Optimista a todas las vistas de detalle en caché.
			// Esto garantiza que el cambio se refleje al instante en la lista de relacionadas
			// en CUALQUIER otra pantalla de detalle que tenga esta estación en su lista.
			queryClient.setQueriesData(
				{ queryKey: [detailBaseKeyName] },
				(cachedData: any) => {
					// Si el dato en caché es la propia página de detalle que estamos viendo
					if (cachedData && cachedData.data?.slug === toggledSlug) {
						return {
							...cachedData,
							data: {
								...cachedData.data,
								isFavorite: !cachedData.data.isFavorite, // Actualiza el corazón del elemento principal
							},
						};
					}

					// Si el dato en caché es CUALQUIER otra página de detalle (donde nuestra estación
					// aparece en la lista de relacionadas)
					if (
						cachedData &&
						cachedData.relatedStations &&
						cachedData.relatedStations.radios
					) {
						const updatedRelated = cachedData.relatedStations.radios.map(
							(station: Station) =>
								station.slug === toggledSlug
									? { ...station, isFavorite: !station.isFavorite } // Actualiza el corazón en la lista de relacionadas
									: station,
						);

						return {
							...cachedData,
							relatedStations: {
								...cachedData.relatedStations,
								radios: updatedRelated,
							},
						};
					}

					return cachedData; // Devolver los datos sin cambios si no hay coincidencia
				},
			);

			// 🌟🌟🌟 LÓGICA DE ACTUALIZACIÓN OPTIMISTA DEL HISTORIAL (ULTRA-DEFENSIVA) 🌟🌟🌟
			queryClient.setQueryData(
				HISTORY_KEY_BASE,
				(cachedData: HistoryResponse | undefined) => {
					if (!cachedData) return cachedData;

					const listKey = entityType === "radio" ? "radios" : "podcasts";
					const nestedKey = entityType === "radio" ? "radioStation" : "podcast";

					let foundAndToggled = false;

					const updatedList = (
						cachedData[listKey as "radios" | "podcasts"] || []
					).map((item) => {
						const nestedEntity = item[nestedKey as "radioStation" | "podcast"];

						if (nestedEntity && nestedEntity.slug === toggledSlug) {
							foundAndToggled = true;
							// Retornar el elemento inmutable con el cambio
							return {
								...item,
								[nestedKey]: {
									...nestedEntity,
									isFavorite: !nestedEntity.isFavorite, // TOGGLE
								} as NestedEntity,
							};
						}
						return item;
					});

					if (!foundAndToggled) {
						console.warn(
							`[OPTIMISTIC WARNING] ⚠️ No se encontró el slug ${toggledSlug} en la caché del historial.`,
						);
						return cachedData;
					}

					// *** NÚCLEO DE LA SOLUCIÓN: GARANTIZAR NUEVA REFERENCIA PROFUNDA ***
					// Esto clona el objeto para asegurar que React detecte que la data cambió.
					const newHistoryResponse = {
						...cachedData,
						[listKey]: updatedList,
					};

					console.log(
						`[OPTIMISTIC SUCCESS] ✅ Éxito: Historial actualizado y clonado profundamente.`,
					);

					// Clonado profundo para garantizar que la referencia del objeto raíz sea nueva
					return JSON.parse(JSON.stringify(newHistoryResponse));
				},
			);
			// 🌟🌟🌟 FIN LÓGICA OPTIMISTA DEL HISTORIAL 🌟🌟🌟

			// Devolver el contexto para el rollback si falla la mutación
			return { detailBaseKeyName, toggledSlug };
		},

		// 2. Si la mutación falla: (Aquí iría el rollback)
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida. Rollback no implementado.");
		},

		// 3. Después de la mutación: Invalida y fuerza la recarga (en el fondo)
		onSettled: (data, error, newFavoriteData, context) => {
			const listQueryKey = getListQueryKey(newFavoriteData.type);
			const detailBaseKeyName = getDetailBaseKeyName(newFavoriteData.type);

			const categoryBaseKey =
				newFavoriteData.type === "radio"
					? CATEGORY_RADIO_KEY_BASE
					: CATEGORY_PODCAST_KEY_BASE;

			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			// A. Invalidar la lista de origen
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// B. Invalidar las listas de favoritos
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });
			queryClient.invalidateQueries({ queryKey: HISTORY_KEY_BASE });

			// queryClient.invalidateQueries( {
			//     queryKey: HISTORY_KEY_BASE,
			//     refetchType: 'all', // Invalida todas las sub-queries (todas las categorías)
			// } );

			// C. Invalidar todas las listas de categorías (e.g., ['podcastcat', 'infinite'])
			// Esto forzará la recarga de la lista de categorías que esté visible actualmente.
			queryClient.invalidateQueries({
				queryKey: categoryBaseKey,
				refetchType: "all", // Invalida todas las sub-queries (todas las categorías)
			});

			// C. Invalidar la clave BASE del DETALLE para que el useFocusEffect recargue la data
			// y confirme que la actualización optimista fue correcta.
			if (context?.toggledSlug) {
				queryClient.invalidateQueries({
					queryKey: [detailBaseKeyName],
					refetchType: "all",
				});
			}
		},
	});
};

/**
 * Retorna la clave base de detalle: 'radioStation' o 'podcast'.
 */
const getDetailBaseKeyNames = (type: EntityType): string =>
	type === "radio" ? "radioStation" : "podcast";

export const useToggleFavorits = () => {
	const queryClient = useQueryClient();

	// Claves de consulta de las listas infinitas (ALL)
	const getListQueryKey = (type: EntityType): QueryKey =>
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];

	// Claves de consulta de los FAVORITOS (MANDATORIO para que recargue la página de favoritos)
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	return useMutation({
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Actualización Optimista del Detalle
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const entityType = newFavoriteData.type;
			const entitySlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

			if (!entitySlug) return;

			const detailBaseKeyName = getDetailBaseKeyName(entityType);
			const detailQueryKey: QueryKey = [detailBaseKeyName, entitySlug];

			// Cancelar queries pendientes para el detalle
			await queryClient.cancelQueries({ queryKey: detailQueryKey });

			// B. Actualización Optimista del DETALLE
			const previousDetailData =
				queryClient.getQueryData<Station>(detailQueryKey);

			if (previousDetailData) {
				const newFavoriteStatus = !previousDetailData.isFavorite;

				// Actualizar la data en caché
				queryClient.setQueryData<Station>(detailQueryKey, (oldData) =>
					oldData ? { ...oldData, isFavorite: newFavoriteStatus } : oldData,
				);
			}

			return { detailBaseKeyName, entitySlug };
		},

		// 2. Si la mutación falla: (Aquí iría el rollback)
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida.", err);
		},

		// 3. Después de la mutación: Invalida y fuerza la recarga de TODO lo relevante.
		onSettled: (data, error, newFavoriteData, context) => {
			const listQueryKey = getListQueryKey(newFavoriteData.type);
			const detailBaseKeyName = getDetailBaseKeyName(newFavoriteData.type);

			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			// A. Invalidar la lista de origen
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// B. Invalidar las listas de favoritos
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });

			// C. 🚨 EL FIX CON REFETCH: Invalidar la clave BASE del DETALLE y forzar la recarga.
			if (context?.entitySlug) {
				queryClient.invalidateQueries({
					queryKey: [detailBaseKeyName],
					// Esto fuerza el refetch de todos los queries que coincidan (incluyendo el detalle del slug)
					// Garantiza que al volver a montar el componente, se busque data nueva.
					refetchType: "all",
				});
			}
			console.log(
				"Invalidación exitosa de Listas ALL, Listas FAVORITOS y Detalle.",
			);
		},
	});
};

export const useToggleFavorit = () => {
	const queryClient = useQueryClient();

	// Función auxiliar para obtener la clave de consulta de una lista de entidades infinitas.
	const getListQueryKey = (type: EntityType): QueryKey => {
		if (type === "radio") {
			return ["radioStations", "infinite"];
		}

		// Asumimos una clave similar para podcasts.
		return ["podcastrd", "infinite"];
	};

	// 💡 CLAVES DE FAVORITOS GLOBALES (COINCIDEN CON useFetchFavorites)
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// Nueva función auxiliar para obtener el nombre de la propiedad del array dentro del objeto de página
	const getEntityArrayKey = (type: EntityType): "stations" | "episodes" => {
		// ASUMIMOS 'episodes' para podcasts y 'stations' para radios
		return type === "radio" ? "stations" : "episodes";
	};

	return useMutation({
		// Usa la función 'togglefavorite' REAL importada (o definida globalmente)
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Actualización Optimista (instantánea)
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const type = newFavoriteData.type;
			const entityArrayKey = getEntityArrayKey(type); // <-- Obtenemos la clave dinámica
			const entityId =
				newFavoriteData.radioStationId || newFavoriteData.podcastId;

			const queryKey = getListQueryKey(type);

			// Cancela cualquier refetch pendiente para que el onMutate no se sobrescriba.
			await queryClient.cancelQueries({ queryKey });

			// Define los tipos de datos en la caché para el rollback
			type EntityPage = RadioStationResponse;
			type InfinitePages = { pages: EntityPage[]; pageParams: unknown[] };
			const previousPages = queryClient.getQueryData<InfinitePages>(queryKey);

			if (previousPages && entityId) {
				const updatedPages: InfinitePages = {
					...previousPages,
					pages: previousPages.pages.map((page) => {
						// Accedemos al array de entidades de forma dinámica usando la clave.
						const currentEntities = (page as any)[entityArrayKey] as
							| Station[]
							| undefined;

						if (!currentEntities) return page;

						const updatedEntities = currentEntities.map((entity: Station) => {
							// Usamos == para comparación flexible si los IDs son number|string
							if (entity.id === entityId) {
								return {
									...entity,
									isFavorite: !entity.isFavorite, // Toggle localmente
								};
							}
							return entity;
						});

						return {
							...page,
							// Asignamos el array actualizado de vuelta a su propiedad original
							[entityArrayKey]: updatedEntities,
						};
					}),
				};

				// Reemplaza los datos en la caché con la versión actualizada
				queryClient.setQueryData(queryKey, updatedPages);
			}

			// Devuelve los datos anteriores para usarlos en el onError (rollback)
			return { previousPages, queryKey };
		},

		// 2. Si la mutación falla: Revierte a los datos anteriores (roll back)
		onError: (err, newFavoriteData, context) => {
			if (context?.previousPages) {
				queryClient.setQueryData(context.queryKey, context.previousPages);
			}
			console.error("Error al alternar favorito. Revertiendo UI:", err);
		},

		// 3. Después de la mutación (éxito o fallo): Invalida para refetch
		onSettled: (data, error, newFavoriteData) => {
			const listQueryKey = getListQueryKey(newFavoriteData.type);

			// Invalidación 1: La lista de origen (emisoras/podcasts)
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// 🚀 Invalidación 2 (EL FIX EXPLÍCITO): Invalida las claves de favoritos.
			// Esto garantiza que la lista de favoritos se refetchee sin importar la pestaña en la que se esté.
			// Usamos las claves exactas definidas en useFetchFavorites.
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });

			console.log(
				"Invalidación explícita de ambas listas de favoritos (Radio y Podcast) realizada.",
			);
		},
	});
};

// Mapea el tipo de entidad a las claves de TanStack Query
export const getKeys = (type: EntityType) => ({
	// Clave de la lista infinita principal (la que no debe saltar)
	listQueryKey:
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"],

	// Clave de la lista infinita de favoritos
	favoritesQueryKey:
		type === "radio"
			? ["favorites", "infinite", "radio"]
			: ["favorites", "infinite", "podcast"],

	// Base key para el detalle (usado para invalidar y parchar el detalle)
	detailBaseKey: type === "radio" ? ["radioStationDetail"] : ["podcastDetail"],

	// Clave dentro del objeto de la página (ej: { stations: [...] } o { podcast: [...] })
	entityArrayKey: type === "radio" ? "stations" : "podcast",
});

//! Casi lo tiene
//! Versión final — sin `source` en el payload, backend-compatible
export const useToggleFavoritess = () => {
	const queryClient = useQueryClient();

	// 💡 CLAVES DE FAVORITOS DEDICADOS
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// 💡 CLAVE BASE DE LISTAS PRINCIPALES (TODAS)
	const getListQueryKey = (type: EntityType): QueryKey =>
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];

	// 💡 CLAVE DE DETALLE
	const DETAIL_RADIO_BASE_KEY: QueryKey = ["radioStation"];

	return useMutation({
		mutationFn: togglefavorite,

		// 1. ANTES de la mutación: Actualiza la caché de forma optimista
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const entityType = newFavoriteData.type;
			const entitySlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

			// Si no hay slug, no podemos identificar el detalle o la lista.
			if (!entitySlug) return;

			const detailQueryKey = [DETAIL_RADIO_BASE_KEY[0], entitySlug];
			const listQueryKey = getListQueryKey(entityType);
			const favoritesQueryKey =
				entityType === "radio" ? FAVORITES_RADIO_KEY : FAVORITES_PODCAST_KEY;

			// 1. Cancelar queries pendientes (Evita que una recarga se solape con nuestro cambio optimista)
			await queryClient.cancelQueries({ queryKey: detailQueryKey });
			await queryClient.cancelQueries({ queryKey: listQueryKey });
			await queryClient.cancelQueries({ queryKey: favoritesQueryKey });

			// 2. Actualización Optimista del DETALLE (El corazón de la vista individual)
			let newFavoriteStatus: boolean | undefined = undefined;
			const previousDetailData =
				queryClient.getQueryData<Station>(detailQueryKey);

			queryClient.setQueryData<Station>(detailQueryKey, (oldData) => {
				if (oldData) {
					newFavoriteStatus = !oldData.isFavorite;
					return { ...oldData, isFavorite: newFavoriteStatus };
				}
				return oldData;
			});
			console.log(`[ON_MUTATE] Detalle optimista: ${newFavoriteStatus}.`);

			// 3. 🚨 ANTI-SALTO: Mutar la caché de la lista principal
			// Esto solo cambia el 'isFavorite' sin mover la tarjeta.
			queryClient.setQueryData<InfiniteData<any>>(listQueryKey, (oldData) => {
				if (!oldData || newFavoriteStatus === undefined) return oldData;

				console.log(
					"[ON_MUTATE] Mutando caché de lista principal (Anti-Salto)...",
				);

				// Mapear cada página y su array interno
				const newPages = oldData.pages.map((page) => {
					const entityArrayKey = entityType === "radio" ? "stations" : "episodes";
					const currentEntities = (page as any)[entityArrayKey] as
						| Station[]
						| undefined;

					if (!currentEntities) return page;

					const updatedEntities = currentEntities.map((item) =>
						item.slug === entitySlug
							? { ...item, isFavorite: newFavoriteStatus! }
							: item,
					);

					return { ...page, [entityArrayKey]: updatedEntities };
				});

				return { ...oldData, pages: newPages as any };
			});

			// 4. Coherencia Total: Mutar la caché de la lista de FAVORITOS (se añade/elimina)
			queryClient.setQueryData<InfiniteData<any>>(
				favoritesQueryKey,
				(oldData) => {
					if (
						!oldData ||
						newFavoriteStatus === undefined ||
						newFavoriteStatus === previousDetailData?.isFavorite
					) {
						return oldData;
					}

					console.log(`[ON_MUTATE] Mutando caché de Favoritos (Add/Remove)...`);

					// Buscamos el ítem completo en la caché de la lista principal para añadirlo si es nuevo favorito
					const itemToToggle = queryClient
						.getQueryData<InfiniteData<any>>(listQueryKey)
						?.pages.flatMap((page) =>
							entityType === "radio" ? page.data : page.episodes,
						)
						.find((item) => item.slug === entitySlug);

					// 4a. Si se desmarca como favorito (Eliminar de la lista de Favoritos)
					if (newFavoriteStatus === false) {
						const newPages = oldData.pages.map((page) => {
							const entityArrayKey =
								entityType === "radio" ? "stations" : "episodes";
							const currentEntities = (page as any)[entityArrayKey] as
								| Station[]
								| undefined;

							if (!currentEntities) return page;

							const updatedEntities = currentEntities.filter(
								(item) => item.slug !== entitySlug,
							);
							return { ...page, [entityArrayKey]: updatedEntities };
						});
						return { ...oldData, pages: newPages as any };
					}

					// 4b. Si se marca como favorito (Añadir al inicio de la lista de Favoritos)
					else if (newFavoriteStatus === true && itemToToggle) {
						const entityArrayKey = entityType === "radio" ? "stations" : "episodes";

						// Aseguramos que el ítem no esté ya en la lista (evita duplicados)
						const isAlreadyPresent = oldData.pages
							.flatMap((page) => (page as any)[entityArrayKey] || [])
							.some((item) => item.slug === entitySlug);

						if (!isAlreadyPresent) {
							const updatedItem = { ...itemToToggle, isFavorite: true };
							const updatedFirstPageEntities = [
								updatedItem,
								...((oldData.pages[0] as any)[entityArrayKey] || []),
							];

							const updatedFirstPage = {
								...oldData.pages[0],
								[entityArrayKey]: updatedFirstPageEntities,
							};
							return {
								...oldData,
								pages: [updatedFirstPage, ...oldData.pages.slice(1)] as any,
							};
						}
					}

					return oldData;
				},
			);

			// Devolvemos el slug y el estado anterior para el rollback (simplificado)
			return { detailQueryKey, entitySlug, previousDetailData };
		},

		// 2. Si la mutación falla: No es necesario hacer rollback de la lista principal ya que solo cambiamos un flag.
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida.", err);
			// Podrías revertir el detalle aquí si lo necesitas:
			if (context?.previousDetailData) {
				queryClient.setQueryData(
					context.detailQueryKey,
					context.previousDetailData,
				);
			}
		},

		// 3. DESPUÉS de la mutación (onSettled): SÓLO invalidamos el Detalle.
		onSettled: (data, error, newFavoriteData, context) => {
			console.log(
				"[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de Detalle.",
			);

			// A. Invalidar el Detalle (para confirmar el estado final del servidor)
			if (context?.entitySlug) {
				queryClient.invalidateQueries({
					queryKey: [DETAIL_RADIO_BASE_KEY[0]],
				});
			}

			// ❌ CLAVE: NO invalidamos la lista principal (listQueryKey) ni la de favoritos (favoritesQueryKey).
			// La coherencia visual ya fue asegurada por las mutaciones optimistas en onMutate.
			// Si invalidamos aquí, volveremos a tener el salto.

			console.log(
				"Coherencia total lograda. Detalle invalidado. Listas mutadas optimista.",
			);
		},
	});
};

//! Casi lo tiene
export const useToggleFavorito = () => {
	const queryClient = useQueryClient();

	// Claves de consulta de las listas infinitas (ALL)
	const getListQueryKey = (type: EntityType): QueryKey =>
		type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];

	// Claves de consulta de los FAVORITOS (MANDATORIO para que recargue la página de favoritos)
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// Clave base para el detalle (radioStation/slug)
	const DETAIL_RADIO_BASE_KEY: QueryKey = ["radioStation"];

	return useMutation({
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Solo actualiza el DETALLE, no la lista principal.
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const entitySlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

			// Usamos el slug como identificador para el detalle
			if (!entitySlug) return;

			const detailQueryKey = [DETAIL_RADIO_BASE_KEY[0], entitySlug];

			// Cancelar queries pendientes para el detalle y la lista
			await queryClient.cancelQueries({ queryKey: detailQueryKey });

			// 🚨 IMPORTANTE: NO CANCELAMOS NI ACTUALIZAMOS LA LISTA INFINITA AQUÍ.
			// Esto es para evitar que la reordenación optimista (el "salto") ocurra.

			// B. Actualización Optimista del DETALLE (Para respuesta instantánea del corazón)
			const previousDetailData =
				queryClient.getQueryData<Station>(detailQueryKey);

			if (previousDetailData) {
				const newFavoriteStatus = !previousDetailData.isFavorite;

				// Actualizar la data en caché
				queryClient.setQueryData<Station>(detailQueryKey, (oldData) =>
					oldData ? { ...oldData, isFavorite: newFavoriteStatus } : oldData,
				);
				console.log(
					`[ON_MUTATE] ✔️ Detalle actualizado a: ${newFavoriteStatus}.`,
				);
			} else {
				console.log(
					"[ON_MUTATE] ⚠️ Detalle no encontrado en caché, omitiendo optimista.",
				);
			}

			// Devolvemos el slug y la clave del detalle para usar en onSettled
			return { detailQueryKey, entitySlug };
		},

		// 2. Si la mutación falla: Revierte solo el detalle (si se actualizó)
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida.", err);

			// No hay rollback de lista ya que no se actualizó optimísticamente
			// Si quieres hacer rollback del detalle, tendrías que guardar previousDetailData en el contexto.
			// Por simplicidad, y ya que hay un refetch en onSettled, lo omitimos.
		},

		// 3. Después de la mutación: Invalida y fuerza la recarga de TODO lo relevante.
		onSettled: (data, error, newFavoriteData, context) => {
			// Claves que necesitan recargarse
			const listQueryKey = getListQueryKey(newFavoriteData.type);

			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			// A. Invalidar la lista de origen (para corregir el favorito en la lista)
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// B. Invalidar las listas de favoritos (¡EL FIX para que la página de favoritos se recargue!)
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });

			// C. Invalidar el detalle (para que el estado final del servidor se aplique)
			if (context?.entitySlug) {
				queryClient.invalidateQueries({
					// Invalida cualquier query que empiece por ['radioStation'] o ['podcast']
					queryKey: [DETAIL_RADIO_BASE_KEY[0]],
				});
			}
			console.log(
				"Invalidación exitosa de Listas ALL, Listas FAVORITOS y Detalle.",
			);
		},
	});
};

// =================================================================
// HOOK DE MUTACIÓN CON DIAGNÓSTICO
// =================================================================

export const useToggleFavoritesss = () => {
	const queryClient = useQueryClient();

	// Claves y utilidades... (mismo que antes)
	const getListQueryKey = (type: EntityType): QueryKey => {
		return type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];
	};
	const getEntityArrayKey = (type: EntityType): "stations" | "episodes" => {
		return type === "radio" ? "stations" : "episodes";
	};
	const DETAIL_RADIO_BASE_KEY: QueryKey = ["radioStation"];

	return useMutation({
		mutationFn: togglefavorite,

		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const type = newFavoriteData.type;
			const entityArrayKey = getEntityArrayKey(type);
			const entityId =
				newFavoriteData.radioStationId || newFavoriteData.podcastId;
			const entitySlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;
			const detailIdentifier = entitySlug || entityId; // 'fhsalsa' en tu caso

			// ... (Cancelación de queries) ...
			const listQueryKey = getListQueryKey(type);
			await queryClient.cancelQueries({ queryKey: listQueryKey });

			// Define los tipos de datos en la caché para el rollback
			type EntityPage = RadioStationResponse;
			type InfinitePages = { pages: EntityPage[]; pageParams: unknown[] };

			if (detailIdentifier) {
				const detailQueryKey = [DETAIL_RADIO_BASE_KEY[0], detailIdentifier];
				await queryClient.cancelQueries({ queryKey: detailQueryKey });
			}

			console.log("[ON_MUTATE] ✅ Iniciando Actualización Optimista");

			// A. Actualización Optimista de la LISTA INFINITA (Requiere ID)
			// (La dejamos igual, ya envías el ID, esto debería funcionar)
			const previousPages =
				queryClient.getQueryData<InfinitePages>(listQueryKey);

			if (previousPages && entityId) {
				console.log(
					"[ON_MUTATE] 🔄 Actualizando Optimista la LISTA INFINITA (Usando ID)",
				);
				// ... (lógica de actualización de lista) ...
				const updatedPages: InfinitePages = {
					...previousPages,
					pages: previousPages.pages.map((page) => {
						const currentEntities = (page as any)[entityArrayKey] as
							| Station[]
							| undefined;
						if (!currentEntities) return page;
						const updatedEntities = currentEntities.map((entity: Station) => {
							if (entity.id === entityId) {
								return { ...entity, isFavorite: !entity.isFavorite };
							}
							return entity;
						});
						return { ...page, [entityArrayKey]: updatedEntities };
					}),
				};
				queryClient.setQueryData(listQueryKey, updatedPages);
			} else {
				console.log(
					"[ON_MUTATE] ⚠️ Omitida la actualización de lista. ID no disponible en el payload.",
				);
			}

			// B. Actualización Optimista del DETALLE (El punto de fallo)
			if (detailIdentifier) {
				const detailQueryKey = [DETAIL_RADIO_BASE_KEY[0], detailIdentifier]; // ['radioStation', 'fhsalsa']

				// 🕵️‍♂️ LOG CRÍTICO 1: ¿Qué clave estamos buscando?
				console.log("[LOG] Detalle Query Key:", detailQueryKey);

				const previousDetailData =
					queryClient.getQueryData<Station>(detailQueryKey);

				// 🕵️‍♂️ LOG CRÍTICO 2: ¿Qué data encontramos en la caché?
				console.log("[LOG] Data en caché para detalle:", previousDetailData);

				if (previousDetailData) {
					// Si llegamos aquí, ¡la data existe!
					const newFavoriteStatus = !previousDetailData.isFavorite;
					queryClient.setQueryData<Station>(detailQueryKey, (oldData) =>
						oldData ? { ...oldData, isFavorite: newFavoriteStatus } : oldData,
					);
					console.log(
						`[ON_MUTATE] ✔️ Detalle ENCONTRADO. Nuevo estado: ${newFavoriteStatus}`,
					);
				} else {
					console.log(
						"[ON_MUTATE] ❌ Detalle NO ENCONTRADO en la caché con esa clave. (FALLO OPTIMISTA)",
					);
				}
			}

			return { previousPages, queryKey: listQueryKey, detailIdentifier };
		},

		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida. Revertiendo caché...", err);
			if (context?.previousPages) {
				queryClient.setQueryData(context.queryKey, context.previousPages);
			}
		},

		// 3. Después de la mutación (éxito o fallo): Invalida para refetch
		onSettled: (data, error, newFavoriteData, context) => {
			const listQueryKey = getListQueryKey(newFavoriteData.type);
			const detailIdentifier = context?.detailIdentifier;

			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// Invalida el detalle (la invalidación amplia del intento anterior)
			if (detailIdentifier) {
				const detailKeyBase =
					newFavoriteData.type === "radio" ? DETAIL_RADIO_BASE_KEY : ["podcast"];
				queryClient.invalidateQueries({
					queryKey: [detailKeyBase[0]], // Solo el prefijo: ['radioStation'] o ['podcast']
				});
			}
		},
	});
};

/*
SIN PROBAR


import { useMutation, useQueryClient, QueryKey, InfiniteData } from "@tanstack/react-query";
// Asumiendo que estos tipos vienen de alguna parte:
// import { FavoriteTogglePayload, EntityType, Station } from './tipos-reales'; 
declare type EntityType = 'radio' | 'podcast';
declare interface FavoriteTogglePayload { type: EntityType; radioSlug?: string; podcastSlug?: string; radioStationId?: string; podcastId?: string; }
declare interface Station { id: any; slug: string; isFavorite: boolean; }
declare const togglefavorite: (payload: FavoriteTogglePayload) => Promise<any>;
declare const Alert: { alert: (title: string, message: string) => void };


const getDetailBaseKey = (type: EntityType): QueryKey => 
    type === 'radio' ? ['radioStationDetail'] : ['podcastDetail'];


export const useToggleFavorite = () => {
    const queryClient = useQueryClient();

    // Claves de consulta de las listas infinitas (ALL)
    const getListQueryKey = (type: EntityType): QueryKey => type === 'radio' ? ["radioStations", "infinite"] : ["podcastrd", "infinite"];

    // Claves de consulta de los FAVORITOS
    const FAVORITES_RADIO_KEY: QueryKey = ['favorites', 'infinite', 'radio'];
    const FAVORITES_PODCAST_KEY: QueryKey = ['favorites', 'infinite', 'podcast'];

    return useMutation({
        mutationFn: togglefavorite,

        // 1. Antes de la mutación: Solo actualiza el DETALLE (Mutación Optimista)
        onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
            const entityType = newFavoriteData.type;
            const entitySlug = newFavoriteData.radioSlug || newFavoriteData.podcastSlug;

            if (!entitySlug) return;

            // 🚨 CORRECCIÓN: Usamos la función unificada para la clave base
            const detailBaseKey = getDetailBaseKey(entityType); 
            const detailQueryKey = [detailBaseKey[0], entitySlug];

            // Cancelar queries pendientes para el detalle
            await queryClient.cancelQueries({ queryKey: detailQueryKey });

            // B. Actualización Optimista del DETALLE
            const previousDetailData = queryClient.getQueryData<Station>(detailQueryKey);

            if (previousDetailData) {
                const newFavoriteStatus = !previousDetailData.isFavorite;

                // Actualizar la data en caché
                queryClient.setQueryData<Station>(
                    detailQueryKey,
                    (oldData) => (oldData ? { ...oldData, isFavorite: newFavoriteStatus } : oldData)
                );
            } 
            
            // Devolvemos el slug y la clave BASE para usar en onSettled
            return { detailBaseKey, entitySlug };
        },

        // 2. Si la mutación falla: (Lógica omitida por simplicidad, pero aquí iría el rollback)
        onError: (err, newFavoriteData, context) => {
            console.error("[ON_ERROR] 🚨 Mutación fallida.", err);
        },

        // 3. Después de la mutación: Invalida y fuerza la recarga de TODO lo relevante.
        onSettled: (data, error, newFavoriteData, context) => {
            
            const entityType = newFavoriteData.type;
            const listQueryKey = getListQueryKey(entityType);
            const detailBaseKey = getDetailBaseKey(entityType); // Usamos la clave base correcta

            console.log('[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.');

            // A. Invalidar la lista de origen (para corregir el favorito en la lista principal)
            queryClient.invalidateQueries({ queryKey: listQueryKey });

            // B. Invalidar las listas de favoritos (¡MANDATORIO para que la página de favoritos se recargue!)
            queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
            queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });

            // C. Invalidar el detalle (¡EL FIX! para que el estado final del servidor se aplique)
            if (context?.entitySlug) {
                queryClient.invalidateQueries({
                    // 🚨 USAMOS LA CLAVE BASE CORRECTA (Ej: ['radioStationDetail'])
                    queryKey: detailBaseKey, 
                    // No hace falta invalidar con exact: true, para que se recargue el detalle específico [base, slug]
                });
            }
            console.log(`Invalidación exitosa de Listas ALL, Listas FAVORITOS y Detalle ${detailBaseKey[0]}.`);
        },
    });
};

* */

// =================================================================
// HOOK DE MUTACIÓN REVISADO CON LOGGING
// =================================================================

export const useToggleFavorites = () => {
	const queryClient = useQueryClient();

	// Clave de lista infinita
	const getListQueryKey = (type: EntityType): QueryKey => {
		return type === "radio"
			? ["radioStations", "infinite"]
			: ["podcastrd", "infinite"];
	};

	// Claves de favoritos (para invalidación)
	const FAVORITES_RADIO_KEY: QueryKey = ["favorites", "infinite", "radio"];
	const FAVORITES_PODCAST_KEY: QueryKey = ["favorites", "infinite", "podcast"];

	// Claves base de detalle
	const DETAIL_RADIO_BASE_KEY: QueryKey = ["radioStation"];
	const DETAIL_PODCAST_BASE_KEY: QueryKey = ["podcast"];

	// Obtiene la clave del array dentro de la respuesta de página
	const getEntityArrayKey = (type: EntityType): "stations" | "episodes" => {
		return type === "radio" ? "stations" : "episodes";
	};

	return useMutation({
		mutationFn: togglefavorite,

		// 1. Antes de la mutación: Actualización Optimista (instantánea)
		onMutate: async (newFavoriteData: FavoriteTogglePayload) => {
			const type = newFavoriteData.type;
			const entityArrayKey = getEntityArrayKey(type);

			// 🎯 Usamos el ID para la lista (si está disponible) y el SLUG/ID para el detalle.
			const entityId =
				newFavoriteData.radioStationId || newFavoriteData.podcastId;
			const entitySlug =
				newFavoriteData.radioSlug || newFavoriteData.podcastSlug;
			const detailIdentifier = entitySlug || entityId; // Preferimos SLUG si existe

			const listQueryKey = getListQueryKey(type);

			// 🛠️ CANCELAR QUERIES PENDIENTES
			await queryClient.cancelQueries({ queryKey: listQueryKey });

			type EntityPage = RadioStationResponse;
			type InfinitePages = { pages: EntityPage[]; pageParams: unknown[] };

			if (detailIdentifier) {
				const detailKeyBase =
					type === "radio" ? DETAIL_RADIO_BASE_KEY : DETAIL_PODCAST_BASE_KEY;
				const detailQueryKey = [detailKeyBase[0], detailIdentifier];
				await queryClient.cancelQueries({ queryKey: detailQueryKey });
			}

			console.log("---------------------------------------------------");
			console.log("[ON_MUTATE] ✅ Iniciando Actualización Optimista");
			console.log(`[ON_MUTATE] Tipo de Entidad: ${type}`);
			console.log(
				`[ON_MUTATE] Identificador de Detalle (Key): ${detailIdentifier}`,
			);

			// ----------------------------------------------------
			// A. Actualización Optimista de la LISTA INFINITA (Requiere ID)
			// ----------------------------------------------------
			const previousPages =
				queryClient.getQueryData<InfinitePages>(listQueryKey);

			if (previousPages && entityId) {
				console.log(
					"[ON_MUTATE] 🔄 Actualizando Optimista la LISTA INFINITA (Usando ID)",
				);

				const updatedPages: InfinitePages = {
					...previousPages,
					pages: previousPages.pages.map((page) => {
						const currentEntities = (page as any)[entityArrayKey] as
							| Station[]
							| undefined;

						if (!currentEntities) return page;

						const updatedEntities = currentEntities.map((entity: Station) => {
							if (entity.id === entityId) {
								return {
									...entity,
									isFavorite: !entity.isFavorite, // Toggle localmente
								};
							}
							return entity;
						});

						return {
							...page,
							[entityArrayKey]: updatedEntities,
						};
					}),
				};

				queryClient.setQueryData(listQueryKey, updatedPages);
			} else {
				console.log(
					"[ON_MUTATE] ⚠️ Omitida la actualización de lista. ID no disponible en el payload.",
				);
			}

			// ----------------------------------------------------
			// B. Actualización Optimista del DETALLE (Usando SLUG/ID)
			// ----------------------------------------------------
			if (detailIdentifier) {
				const detailKeyBase =
					type === "radio" ? DETAIL_RADIO_BASE_KEY : DETAIL_PODCAST_BASE_KEY;
				const detailQueryKey = [detailKeyBase[0], detailIdentifier]; // CLAVE CRÍTICA: ['radioStation', slug]

				const previousDetailData =
					queryClient.getQueryData<Station>(detailQueryKey);

				console.log(
					`[ON_MUTATE] Buscando detalle con clave: [${detailQueryKey.join(", ")}]`,
				);

				if (previousDetailData) {
					const newFavoriteStatus = !previousDetailData.isFavorite;
					console.log(
						`[ON_MUTATE] ✔️ Detalle ENCONTRADO. Nuevo estado: ${newFavoriteStatus}`,
					);

					queryClient.setQueryData<Station>(detailQueryKey, (oldData) => {
						if (oldData) {
							return { ...oldData, isFavorite: newFavoriteStatus };
						}
						return oldData;
					});
				} else {
					console.log(
						"[ON_MUTATE] ❌ Detalle NO ENCONTRADO en la caché con esa clave. (FALLO OPTIMISTA)",
					);
				}
			}

			// Devuelve los datos anteriores para usarlos en el onError (rollback)
			console.log("---------------------------------------------------");
			return { previousPages, queryKey: listQueryKey, detailIdentifier };
		},

		// 2. Si la mutación falla: Revierte a los datos anteriores (roll back)
		onError: (err, newFavoriteData, context) => {
			console.error("[ON_ERROR] 🚨 Mutación fallida. Revertiendo caché...", err);
			if (context?.previousPages) {
				queryClient.setQueryData(context.queryKey, context.previousPages);
			}
			// NOTA: El detalle se revertirá cuando onSettled fuerce la invalidación.
		},

		// 3. Después de la mutación (éxito o fallo): Invalida para refetch
		onSettled: (data, error, newFavoriteData, context) => {
			const type = newFavoriteData.type;
			const listQueryKey = getListQueryKey(type);
			const detailIdentifier = context?.detailIdentifier;

			console.log("---------------------------------------------------");
			console.log("[ON_SETTLED] 🚀 Finalizada. Forzando invalidación de datos.");

			// 1. Invalidar la lista de origen
			queryClient.invalidateQueries({ queryKey: listQueryKey });

			// 2. Invalidar las listas de favoritos (radio y podcast)
			queryClient.invalidateQueries({ queryKey: FAVORITES_RADIO_KEY });
			queryClient.invalidateQueries({ queryKey: FAVORITES_PODCAST_KEY });

			// 3. Invalidar la vista de DETALLE por SLUG o ID
			if (detailIdentifier) {
				const detailKeyBase =
					type == "radio" ? DETAIL_RADIO_BASE_KEY : DETAIL_PODCAST_BASE_KEY;
				const detailQueryKey = [detailKeyBase, detailIdentifier];

				queryClient.invalidateQueries({
					queryKey: detailQueryKey,
					exact: true,
				});

				console.log(
					`[ON_SETTLED] Invalidación forzada del detalle: [${detailQueryKey.join(", ")}]`,
				);
			}
			console.log("---------------------------------------------------");
		},
	});
};

//     const queryClient = useQueryClient();

//     // Función auxiliar para obtener la clave de consulta de una lista de entidades.
//     const getListQueryKey = ( type: EntityType ): QueryKey => {
//         if ( type === 'radio' ) {
//             return ["radioStations", "infinite"];
//         }
//         // Asumimos una clave similar para podcasts.
//         return ["podcastEpisodes", "infinite"];
//     };

//     return useMutation( {
//         mutationFn: togglefavorite,

//         // 1. Antes de la mutación: Actualización Optimista (instantánea)
//         onMutate: async ( newFavoriteData: FavoriteTogglePayload ) => {

//             const type = newFavoriteData.type;
//             // El ID relevante es el que no es undefined en el payload.
//             const entityId = newFavoriteData.radioStationId || newFavoriteData.podcastId;

//             const queryKey = getListQueryKey( type );

//             // Cancela cualquier refetch pendiente que pueda sobrescribir nuestra actualización optimista.
//             await queryClient.cancelQueries( { queryKey } );

//             // Guarda la data actual de la lista. Usamos RadioStationResponse[] para tipar las páginas.
//             type InfinitePages = { pages: RadioStationResponse[], pageParams: unknown[] };
//             const previousPages = queryClient.getQueryData<InfinitePages>( queryKey );

//             // Actualiza la caché de TanStack Query de forma optimista.
//             if ( previousPages && entityId ) {
//                 const updatedPages: InfinitePages = {
//                     ...previousPages,
//                     // Mapeamos sobre cada página de resultados
//                     pages: previousPages.pages.map( page => ( {
//                         // Mantenemos las propiedades de la respuesta de la página (currentPage, totalPages, limit, etc.)
//                         ...page,
//                         // 💡 CORRECCIÓN: Mapeamos el array 'stations' DENTRO del objeto de la página.
//                         stations: page.stations.map( ( entity: Station ) => {
//                             // Comparar el ID de la entidad con el ID de la mutación
//                             if ( entity.id === entityId ) {
//                                 return {
//                                     ...entity,
//                                     isFavorite: !entity.isFavorite // Toggle localmente
//                                 };
//                             }
//                             return entity;
//                         } ),
//                     } ) ),
//                 };

//                 // Establece el nuevo dato optimista en la caché.
//                 queryClient.setQueryData( queryKey, updatedPages );
//             }

//             // Devuelve el contexto (el estado anterior) que se puede usar en onError.
//             return { previousPages, queryKey };
//         },

//         // 2. Si la mutación falla: Revierte a los datos anteriores (roll back)
//         onError: ( err, newFavoriteData, context ) => {
//             // Si el contexto existe, revierte la caché al estado que guardamos antes.
//             if ( context?.previousPages ) {
//                 queryClient.setQueryData( context.queryKey, context.previousPages );
//             }
//             console.error( "Error al alternar favorito. Revertiendo UI:", err );
//         },

//         // 3. Después de la mutación (éxito o fallo): Invalida para refetch
//         onSettled: ( data, error, newFavoriteData ) => {
//             const queryKey = getListQueryKey( newFavoriteData.type );

//             // Invalida la query de la lista principal para asegurar la sincronización final con el backend.
//             queryClient.invalidateQueries( { queryKey } );

//             // Opcionalmente, invalida la query de la lista de favoritos si existe
//             queryClient.invalidateQueries( { queryKey: ['favorites', 'list'] } );
//         },
//     } );
// };
