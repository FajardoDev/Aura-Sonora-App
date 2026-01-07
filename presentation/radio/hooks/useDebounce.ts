// hooks/useDebounce.ts

import { useEffect, useState } from 'react';

/**
 * @description Hook que retrasa la actualización de un valor hasta que el usuario deja de escribir.
 * @param value El valor a retrasar.
 * @param delay El tiempo de espera en milisegundos (ej: 300).
 * @returns El valor retrasado.
 */
export function useDebounce<T>( value: T, delay: number ): T {
    const [debouncedValue, setDebouncedValue] = useState( value );

    useEffect( () => {
        // 1. Establece un temporizador.
        const handler = setTimeout( () => {
            setDebouncedValue( value );
        }, delay );

        // 2. Limpia el temporizador anterior si el valor cambia antes de que expire el delay.
        // Esto es CLAVE para la optimización y performance.
        return () => {
            clearTimeout( handler );
        };
    }, [value, delay] );

    return debouncedValue;
}