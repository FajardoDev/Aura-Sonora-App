/* eslint-disable @typescript-eslint/no-unused-vars */
import * as SecureStore from "expo-secure-store"; // npx expo install expo-secure-store
import { Alert } from "react-native";

export class SecureStorageAdapter {
    // Methops https://docs.expo.dev/versions/latest/sdk/securestore/
    static async setItem( key: string, value: string ) {
        try {
            await SecureStore.setItemAsync( key, value );
        } catch ( error ) {
            Alert.alert( "Error", "No se pudo guardar datos" );
        }
    }

    static async getItem( key: string ) {
        try {
            return await SecureStore.getItemAsync( key );
        } catch ( error ) {
            Alert.alert( "Error", "No se pudo obtener los datos" );
            return null;
        }
    }

    static async removeItem( key: string ) {
        try {
            await SecureStore.deleteItemAsync( key );
        } catch ( error ) {
            console.log( error );
            Alert.alert( "Error", "No se pudo eliminar los datos" );
        }
    }
}
