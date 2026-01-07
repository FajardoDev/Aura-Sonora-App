import { useRef } from "react";
import { Animated, Easing } from "react-native";

export default function useAnimation() {
    const animatedOpacity = useRef( new Animated.Value( 0 ) ).current; // va de 0 al valor dado
    // const animatedTop = useRef(new Animated.Value(-270)).current; // -100
    const animatedTop = useRef( new Animated.Value( 0 ) ).current; // -100

    const fadeIn = ( {
        duration = 300,
        toValue = 1,
        useNativeDriver = true,
        easing = Easing.linear,
        callback = () => { },
    } ) => {
        Animated.timing( animatedOpacity, {
            toValue: toValue, //1,
            duration: duration, //300,
            useNativeDriver: useNativeDriver, //true,
            easing: easing,
        } ).start( callback );
    };

    const fadeOut = ( {
        duration = 300,
        toValue = 0,
        useNativeDriver = true,
        easing = Easing.ease,
        callback = () => { },
    } ) => {
        Animated.timing( animatedOpacity, {
            toValue: toValue,
            duration: duration,
            useNativeDriver: useNativeDriver,
            easing: easing,
        } ).start( callback );
        // }).start(() => animatedTop.setValue(-270)); // -100
        // }).start(() => animatedTop.resetAnimation());
    };

    const startMovingTopPosition = (
        initialPosition = -270,
        duration = 1300,
        toValue = 0,
        useNativeDriver = true,
        easing = Easing.bounce,
        callback = () => { },
    ) => {
        animatedTop.setValue( initialPosition );

        Animated.timing( animatedTop, {
            toValue: toValue,
            duration: duration, // 700
            useNativeDriver: useNativeDriver,
            // easing: Easing.elastic(1),
            // easing: Easing.bounce,
            // easing: Easing.linear,
            easing: easing,
        } ).start( callback );
    };

    return {
        // Properties
        animatedTop,
        animatedOpacity,

        // Methods
        fadeOut,
        fadeIn,
        startMovingTopPosition,
    };
}
