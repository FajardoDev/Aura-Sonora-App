/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./presentation/**/*.{js,jsx,ts,tsx}",
  ],
  // presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // COLORES LIGHT
        light: {
          // Colores originales que faltaban en tu lista inicial de config:
          tint: "#0a7ea4",
          icon: "#687076",
          tabIconDefault: "#687076",
          tabIconSelected: "#0a7ea4",
          success: "#52d49b",

          // Colores que ya tenías:
          primary: "#3D64F4",
          secondary: "#b40086",
          terciary: "#f43f5e",
          tertiary: "#ef2967",
          background: "#fff",
          text: "#11181C",
        },
        // COLORES DARK
        dark: {
          // Colores originales que faltaban en tu lista inicial de config:
          tint: "#fff",
          icon: "#9BA1A6",
          tabIconDefault: "#9BA1A6",
          tabIconSelected: "#fff",
          success: "#3a9d78",

          // Colores que ya tenías:
          primary: "#3D64F4",
          secondary: "#d138a8",
          terciary: "#f43f5e",
          tertiary: "#ff527f",
          background: "#1F2B43",
          text: "#ECEDEE",
        },
      },
      fontFamily: {
        "Roboto-Thin": ["Roboto-Thin"],
        "Roboto-ExtraLight": ["Roboto-ExtraLight"],
        "Roboto-Light": ["Roboto-Light"],
        "Roboto-Regular": ["Roboto-Regular"],
        "Roboto-Medium": ["Roboto-Medium"],
        "Roboto-SemiBold": ["Roboto-SemiBold"],
        "Roboto-Bold": ["Roboto-Bold"],
        "Roboto-ExtraBold": ["Roboto-ExtraBold"],
        "Roboto-Black": ["Roboto-Black"],
        "Gotu-Regular": ["Gotu-Regular"],
      },
    },
  },
  plugins: [],
};
