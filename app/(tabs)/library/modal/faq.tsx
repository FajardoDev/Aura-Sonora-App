import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

export default function ModalPantallaFaq() {
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const router = useRouter();

  const faqs = [
    {
      question: "¿Cómo puedo agregar una emisora a mis favoritos?",
      answer:
        "Para guardar tus emisoras o podcast preferidos, inicia sesión con tu cuenta. Una vez dentro, haz clic en el icono de 'favorito' ubicado junto a cada emisora y podcast para añadirlos fácilmente a tu lista personal de favoritos.",
    },
    {
      question: "¿Cómo funciona la función de Últimas Escuchadas?",
      answer:
        "La plataforma guarda automáticamente un historial de tus emisoras y episodios de podcast reproducidas recientemente. Puedes acceder a esta lista desde la sección 'Historial' y continuar donde lo dejaste en cualquier momento. Además, los 5 más recientes siempre estarán visibles en la página de inicio.",
    },
    {
      question: "¿Qué tipos de emisoras de radio y podcast puedo encontrar?",
      answer:
        "Explora emisoras de república dominicana organizadas por género. Descubre contenido en vivo de música, noticias, deportes, cultura, educación y mucho más, todo en un solo lugar. También puedes encontrar los podcasts locales más populares y escuchados en el país.",
    },
    {
      question: "¿Puedo dejar comentarios en emisoras y podcast?",
      answer:
        "Sí. Una vez que hayas iniciado sesión, puedes participar dejando tus opiniones y valoraciones en la sección de comentarios disponible en cada emisora y podcast. También puedes comentar directamente desde la imagen del reproductor global o desde la card donde aparece el nombre y la estrella.",
    },
    {
      question: "¿Cómo encontrar emisoras y podcast por categoría?",
      answer:
        "Puedes navegar por emisoras y podcasts específicos usando los links de categorías. Al dar clic te lleva a las categorías de ese género. En la página de inicio están las categorías más populares y al hacer clic en la card también filtran por emisora, género o popularidad.",
    },
  ];

  // Estado para controlar preguntas expandidas
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: background,
        padding: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Título */}
      <ThemedText className="text-2xl font-bold text-center mb-6">
        ❓ Preguntas Frecuentes
      </ThemedText>

      {/* Lista de preguntas */}
      {faqs.map((faq, index) => (
        <View key={index} className="mb-4 border-b border-gray-300 pb-3">
          <Pressable
            onPress={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            className="py-2"
          >
            <ThemedText className="font-semibold text-lg">
              {faq.question}
            </ThemedText>
          </Pressable>

          {expandedIndex === index && (
            <ThemedText className="mt-2 text-base opacity-90">
              {faq.answer}
            </ThemedText>
          )}
        </View>
      ))}

      {/* Botón cerrar */}
      <View className="mt-8 items-center">
        <ThemedButton
          onPress={() => router.back()}
          className="px-6 py-3 rounded-xl"
        >
          Cerrar
        </ThemedButton>
      </View>

      {/* <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} /> */}
    </ScrollView>
  );
}
