// import TrackPlayer, { Event } from "react-native-track-player";

// export const PlaybackService = async function () {
//   // Eventos de control remoto (Pantalla de bloqueo / Notificación)
//   TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
//   TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

//   // ERROR 1 SOLUCIONADO: Se usa reset() en lugar de destroy()
//   TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());

//   TrackPlayer.addEventListener(Event.RemoteSeek, (event) =>
//     TrackPlayer.seekTo(event.position)
//   );

//   // ERROR 2 SOLUCIONADO: Uso de getProgress() para saltos
//   TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
//     const progress = await TrackPlayer.getProgress();
//     await TrackPlayer.seekTo(progress.position + event.interval);
//   });

//   TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
//     const progress = await TrackPlayer.getProgress();
//     await TrackPlayer.seekTo(progress.position - event.interval);
//   });
// };

// import TrackPlayer, { Event, Progress } from "react-native-track-player";

// export default function PlaybackService() {
//   // Eventos de control remoto (Pantalla de bloqueo / Notificación)
//   TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
//   TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

//   // ERROR 1 SOLUCIONADO: Se usa reset() en lugar de destroy()
//   TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());

//   TrackPlayer.addEventListener(Event.RemoteSeek, (event) =>
//     TrackPlayer.seekTo(event.position)
//   );

//   // ERROR 2 SOLUCIONADO: Uso de getProgress() para saltos
//   TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
//     const progress: Progress = await TrackPlayer.getProgress();
//     await TrackPlayer.seekTo(progress.position + event.interval);
//   });

//   TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
//     const progress: Progress = await TrackPlayer.getProgress();
//     await TrackPlayer.seekTo(progress.position - event.interval);
//   });
// }
