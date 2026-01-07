// export interface Datum {
//   id: string;
//   title: string; // Mejor string que Enum para flexibilidad
//   body: string;
//   data: NotificationData; // Renombrado para claridad
//   isRead: boolean;
//   createdAt: string; // ISO Date
// }

// export interface NotificationData {
//   type: "podcast" | "radio"; // Unión de tipos mejor que Enum
//   // Campos para Podcast
//   episodeId?: string;
//   podcastSlug?: string;
//   // Campos para Radio (Futuro)
//   slug?: string;
//   stationName?: string;
// }

// export interface NotificationsResponse {
//   meta: Meta;
//   data: Datum[];
// }

// export interface Meta {
//   total: number;
//   unread: number;
//   page: number;
//   limit: number;
// }

// export interface Datum {
//     id:        string;
//     title:     Title;
//     body:      string;
//     data:      Data;
//     isRead:    boolean;
//     createdAt: CreatedAt;
// }

// export interface CreatedAt {
// }

// export interface Data {
//     type:        Type;
//     episodeId:   string;
//     podcastSlug: PodcastSlug;
//     podcastId?:  string;
// }

// export enum PodcastSlug {
//     LosVerdaderosCodigos = "los-verdaderos-codigos",
//     YoPuedoInvertirPodcast = "yo-puedo-invertir---podcast",
// }

// export enum Type {
//     Podcast = "podcast",
// }

// export enum Title {
//     NuevoEpisodioDisponible = "\ud83c\udfa7 Nuevo episodio disponible",
//     TestEpisodioNuevo = "\ud83e\uddea Test episodio nuevo",
// }

// export interface Meta {
//     total:  number;
//     unread: number;
//     page:   number;
//     limit:  number;
// }

export interface NotificationsResponse {
  meta: Meta;
  data: NotificationItem[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  data: {
    type: "podcast" | "radio";
    episodeId?: string;
    podcastSlug?: string;
    slug?: string;
  };
  createdAt: string; // Cambiado de any a string para fechas
}

export interface Meta {
  total: number;
  unread: number;
  page: number;
  limit: number;
}
