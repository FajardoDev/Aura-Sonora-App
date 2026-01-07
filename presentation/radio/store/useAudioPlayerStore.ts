import { create } from 'zustand';


type PlayerType = 'radio' | 'podcast' | null;

interface AudioPlayerState {
    streamUrl: string | null;
    radioName: string | null;
    radioimg: string | null;
    slug: string | null;
    episodeSlug:  string | null
    isPlaying: boolean;
    radioid: string | null
    volume: number; // Volumen (0 a 100)
    // isFavorite: boolean;
    type: PlayerType; //!MODIFIQUEE
    

    setStream: ( streamUrl: string, radioName: string, radioimg: string, slug: string, episodeSlug: string,  radioid: string, 
        // isFavorite: boolean, 
        type: PlayerType,  ) => void;
    // setIsFavorite: (isFavorite: boolean) => void; // <--- AGREGAR ESTO
    togglePlay: ( savedIsPlaying?: boolean ) => void;
    clearStream: () => void;
    setVolume: ( volume: number ) => void;
}


export const useAudioPlayerStore = create<AudioPlayerState>()(

    ( set, get ) => ( {
        streamUrl: null,
        radioName: null,
        radioimg: null,
        slug: null,
        episodeSlug: null,
        radioid: null,
        isPlaying: false,
        volume: 0.5, // Subido a 50 como valor inicial por defecto
        // isFavorite: false,
        type: null,

        setStream: (
            newStreamUrl,
            radioName,
            radioimg,
            slug,
            radioid,
            // type = 'radio',  // ✅ Valor por defecto, para emisoras
            episodeSlug: string | null = null, // 👈 Valor por defecto null
            // isFavorite,
            type: PlayerType = 'radio',
        ) => {

            const { streamUrl } = get();
            // Si la URL es la misma, solo regresamos, la reproducción se mantiene.
            if ( newStreamUrl === streamUrl ) {
                return;
            }

            // Si la URL cambia, actualizamos el estado e iniciamos la reproducción.
            set( {
                streamUrl: newStreamUrl,
                radioName,
                radioimg,
                slug,
                radioid,
                isPlaying: true,// CRÍTICO: Siempre comienza a reproducir cuando se establece un nuevo stream
                episodeSlug: episodeSlug,
                // isFavorite: isFavorite,
                type,
            } );
        },

        // Implementación sin inventos para actualizar el corazón
//   setIsFavorite: (isFavorite) => set({ isFavorite }),


        togglePlay: ( savedIsPlaying?: boolean ) =>
            set( ( state ) => ( { isPlaying: savedIsPlaying !== undefined ? savedIsPlaying : !state.isPlaying, } ) ),

        clearStream: () => set( { streamUrl: null, radioName: null, radioimg: null, slug: null, isPlaying: false, 
            // isFavorite: false, 
            radioid: null, type: null, episodeSlug: null, 

        } ),

        setVolume: ( newVolume: number ) => set( { volume: newVolume } ),

    } ),

)





// import { create } from 'zustand';
// import { persist } from "zustand/middleware";


// interface AudioPlayerState {
//     streamUrl: string | null;
//     radioName: string | null;
//     radioimg: string | null;
//     slug: string | null;
//     isPlaying: boolean;
//     radioid: string | null
//     volume: number; // 💡 NUEVO: Volumen (0 a 100)

//     setStream: ( streamUrl: string, radioName: string, radioimg: string, slug: string, radioid: string ) => void;
//     togglePlay: ( savedIsPlaying?: boolean ) => void;
//     clearStream: () => void;
//     setVolume: ( volume: number ) => void; // 💡 NUEVO: Control de volumen
// }


// export const useAudioPlayerStore = create<AudioPlayerState>()(
//     persist(
//         ( set, get ) => ( {
//             streamUrl: null,
//             radioName: null,
//             radioimg: null,
//             slug: null,
//             radioid: null,
//             isPlaying: false,
//             volume: 20, // 💡 VALOR INICIAL: 20%

//             setStream: (
//                 newStreamUrl,
//                 // streamUrl,
//                 radioName,
//                 radioimg,
//                 slug,
//                 radioid
//             ) => {

//                 const { streamUrl } = get();
//                 // 🎯 SOLUCIÓN AL DOBLE AUDIO:
//                 if ( newStreamUrl === streamUrl ) {
//                     return;
//                 }

//                 set( {
//                     streamUrl: newStreamUrl,
//                     radioName,
//                     radioimg,
//                     slug,
//                     radioid,
//                     isPlaying: true,// Siempre comienza a reproducir cuando se establece un nuevo stream
//                 } );
//             },


//             togglePlay: ( savedIsPlaying?: boolean ) =>
//                 set( ( state ) => ( { isPlaying: savedIsPlaying !== undefined ? savedIsPlaying : !state.isPlaying } ) ),

//             clearStream: () => set( { streamUrl: null, radioName: null, radioimg: null, slug: null, isPlaying: false } ),

//             // 💡 NUEVO: Función para actualizar el volumen
//             setVolume: ( newVolume: number ) => set( { volume: newVolume } ),

//         } ),
//         { name: "reproductor-storage", }
//     ),
// );





/*
import { Audio } from "expo-av";
import { create } from 'zustand';


interface AudioPlayerState {
    player: Audio.Sound | null;
    streamUrl: string | null;
    radioName: string | null;
    radioimg: string | null;
    slug: string | null;
    isPlaying: boolean;
    radioid: string | null
    volume: number; // 💡 NUEVO: Volumen (0 a 100)

    setPlayer: ( playerInstance: Audio.Sound | null ) => void;
    setStream: ( streamUrl: string, radioName: string, radioimg: string, slug: string, radioid: string ) => void;
    togglePlay: ( savedIsPlaying?: boolean ) => void;
    clearStream: () => void;
    setVolume: ( volume: number ) => void; // 💡 NUEVO: Control de volumen
}


export const useAudioPlayerStore = create<AudioPlayerState>()(

    ( set, get ) => ( {
        player: null,
        streamUrl: null,
        radioName: null,
        radioimg: null,
        slug: null,
        radioid: null,
        isPlaying: false,
        volume: 20, // 💡 VALOR INICIAL: 20%

        // 🎯 FUNCIÓN CRÍTICA: Establece el objeto Audio.Sound
        setPlayer: ( playerInstance ) => set( { player: playerInstance } ),



        setStream: async (
            newStreamUrl,
            // streamUrl,
            radioName,
            radioimg,
            slug,
            radioid
        ) => {

            const { player, clearStream } = get();

            await clearStream();

            const { streamUrl } = get();
            // 🎯 SOLUCIÓN AL DOBLE AUDIO: 
            if ( newStreamUrl === streamUrl ) {
                return;
            }

            set( {
                streamUrl: newStreamUrl,
                radioName,
                radioimg,
                slug,
                radioid,
                isPlaying: true,// Siempre comienza a reproducir cuando se establece un nuevo stream
            } );
        },

        // 🎯 FUNCIÓN CLAVE: Alternar reproducción
        togglePlay: async () => {
            const { player, isPlaying } = get();
            if ( !player ) return;

            if ( isPlaying ) {
                await player.pauseAsync();
                set( { isPlaying: false } );
            } else {
                await player.playAsync();
                set( { isPlaying: true } );
            }
        },

        // 🎯 FUNCIÓN CLAVE: Limpiar y detener completamente
        clearStream: async () => {
            const { player } = get();
            if ( player ) {
                console.log( "Store: Unloading old Audio.Sound instance..." );
                try {
                    await player.pauseAsync();
                    // CRÍTICO: Descargar (unload) el recurso nativo
                    await player.unloadAsync();
                } catch ( e ) {
                    console.error( "Error unloading player:", e );
                }
            }

            // Restablecer el estado
            set( {
                player: null,
                streamUrl: null,
                radioName: null,
                isPlaying: false,
            } );
        },
        // 💡 NUEVO: Función para actualizar el volumen
        setVolume: ( newVolume: number ) => set( { volume: newVolume } ),

    } ),

)


//! último
import { create } from 'zustand';
import { persist } from "zustand/middleware";


interface AudioPlayerState {
    streamUrl: string | null;
    radioName: string | null;
    radioimg: string | null;
    slug: string | null;
    isPlaying: boolean;
    radioid: string | null
    volume: number; // 💡 NUEVO: Volumen (0 a 100)

    setStream: ( streamUrl: string, radioName: string, radioimg: string, slug: string, radioid: string ) => void;
    togglePlay: ( savedIsPlaying?: boolean ) => void;
    clearStream: () => void;
    setVolume: ( volume: number ) => void; // 💡 NUEVO: Control de volumen
}


export const useAudioPlayerStore = create<AudioPlayerState>()(
    persist(
        ( set, get ) => ( {
            streamUrl: null,
            radioName: null,
            radioimg: null,
            slug: null,
            radioid: null,
            isPlaying: false,
            volume: 20, // 💡 VALOR INICIAL: 20%

            setStream: (
                newStreamUrl,
                // streamUrl,
                radioName,
                radioimg,
                slug,
                radioid
            ) => {

                const { streamUrl } = get();
                // 🎯 SOLUCIÓN AL DOBLE AUDIO: 
                if ( newStreamUrl === streamUrl ) {
                    return;
                }

                set( {
                    streamUrl: newStreamUrl,
                    radioName,
                    radioimg,
                    slug,
                    radioid,
                    isPlaying: true,// Siempre comienza a reproducir cuando se establece un nuevo stream
                } );
            },


            togglePlay: ( savedIsPlaying?: boolean ) =>
                set( ( state ) => ( { isPlaying: savedIsPlaying !== undefined ? savedIsPlaying : !state.isPlaying } ) ),

            clearStream: () => set( { streamUrl: null, radioName: null, radioimg: null, slug: null, isPlaying: false } ),

            // 💡 NUEVO: Función para actualizar el volumen
            setVolume: ( newVolume: number ) => set( { volume: newVolume } ),

        } ),
        { name: "reproductor-storage", }
    ),
); 





import { create } from 'zustand';


interface AudioPlayerState {
    streamUrl: string | null;
    radioName: string | null;
    radioimg: string | null;
    slug: string | null;
    isPlaying: boolean;
    radioid: string | null
    volume: number; // 💡 NUEVO: Volumen (0 a 100)

    setStream: ( streamUrl: string, radioName: string, radioimg: string, slug: string, radioid: string ) => void;
    togglePlay: ( savedIsPlaying?: boolean ) => void;
    clearStream: () => void;
    setVolume: ( volume: number ) => void; // 💡 NUEVO: Control de volumen
}


export const useAudioPlayerStore = create<AudioPlayerState>()(

    ( set, get ) => ( {
        streamUrl: null,
        radioName: null,
        radioimg: null,
        slug: null,
        radioid: null,
        isPlaying: false,
        volume: 20, // 💡 VALOR INICIAL: 20%

        setStream: (
            newStreamUrl,
            // streamUrl,
            radioName,
            radioimg,
            slug,
            radioid
        ) => {

            const { streamUrl } = get();
            // 🎯 SOLUCIÓN AL DOBLE AUDIO: 
            if ( newStreamUrl === streamUrl ) {
                return;
            }

            set( {
                streamUrl: newStreamUrl,
                radioName,
                radioimg,
                slug,
                radioid,
                isPlaying: true,// Siempre comienza a reproducir cuando se establece un nuevo stream
            } );
        },


        togglePlay: ( savedIsPlaying?: boolean ) =>
            set( ( state ) => ( { isPlaying: savedIsPlaying !== undefined ? savedIsPlaying : !state.isPlaying } ) ),

        clearStream: () => set( { streamUrl: null, radioName: null, radioimg: null, slug: null, isPlaying: false } ),

        // 💡 NUEVO: Función para actualizar el volumen
        setVolume: ( newVolume: number ) => set( { volume: newVolume } ),

    } ),

)



* */
