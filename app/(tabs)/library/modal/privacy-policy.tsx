import { ScrollView, View } from "react-native";

import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";

export default function PrivacyPolicy() {
  const background = useThemeColor({}, "background");
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: background,
        paddingBottom: 170,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado */}
      <ThemedText
        style={{
          fontSize: 26,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Política de Privacidad — Aura Sonora
      </ThemedText>

      {/* Introducción */}
      <ThemedText
        style={{
          textAlign: "center",
          marginBottom: 24,
          fontSize: 16,
          lineHeight: 24,
          opacity: 0.9,
        }}
      >
        En <ThemedText style={{ fontWeight: "600" }}>Aura Sonora</ThemedText>,
        valoramos profundamente tu privacidad. Esta política explica cómo
        recopilamos, protegemos y utilizamos tu información personal mientras
        disfrutas de nuestras emisoras en vivo, podcasts dominicanos y contenido
        exclusivo. Nuestro compromiso es ofrecerte una experiencia segura,
        personalizada y libre de preocupaciones.
      </ThemedText>

      {/* Secciones */}
      <View style={{ gap: 24 }}>
        {/* 1. Información que recopilamos */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            1. Información que Recopilamos
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Recopilamos datos personales básicos como tu nombre, dirección de
            correo electrónico y tus preferencias cuando creas una cuenta o
            utilizas nuestras funciones. También registramos datos de uso, como
            las emisoras que escuchas, tus podcasts favoritos, historial de
            reproducción y búsquedas recientes. Esta información nos ayuda a
            ofrecerte contenido relevante y mejorar continuamente la experiencia
            dentro de la app.
          </ThemedText>
        </View>

        {/* 2. Cómo utilizamos tu información */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            2. Cómo Utilizamos tu Información
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Tu información nos permite personalizar tu experiencia, mejorar la
            recomendación de contenido y mantenerte al día con tus programas y
            emisoras preferidas. En Aura Sonora nunca compartimos tus datos con
            terceros sin tu consentimiento. Nuestro objetivo es crear una
            comunidad de oyentes responsable y protegida.
          </ThemedText>
        </View>

        {/* 3. Protección de tus datos */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            3. Protección de tus Datos
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Implementamos medidas de seguridad avanzadas —como cifrado,
            autenticación segura y control de accesos— para mantener tu
            información protegida frente a accesos no autorizados, pérdidas o
            modificaciones. Trabajamos constantemente para garantizar que Aura
            Sonora cumpla con los estándares internacionales de privacidad y
            seguridad digital.
          </ThemedText>
        </View>

        {/* 4. Uso de cookies */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            4. Uso de Cookies
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Utilizamos cookies y tecnologías similares para mejorar tu
            experiencia, guardar tus preferencias y analizar el rendimiento del
            sitio y la app. Si usas Aura Sonora desde la versión web, puedes
            gestionar o desactivar las cookies desde tu navegador cuando lo
            desees.
          </ThemedText>
        </View>

        {/* 5. Derechos del usuario */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            5. Derechos del Usuario
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Tienes el derecho de acceder, actualizar o eliminar tus datos
            personales. Si deseas ejercer estos derechos o tienes inquietudes
            sobre cómo gestionamos tu información, puedes contactarnos a través
            de nuestra página de contacto o enviarnos un correo a nuestro canal
            de soporte. En Aura Sonora creemos en la transparencia y el control
            total de tu experiencia.
          </ThemedText>
        </View>

        {/* 6. Cambios en esta política */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            6. Cambios en esta Política
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Nos reservamos el derecho de actualizar esta política cuando sea
            necesario para reflejar cambios legales o mejoras en nuestros
            servicios. La versión más reciente estará siempre disponible en esta
            página. Te recomendamos revisarla periódicamente.
          </ThemedText>
        </View>

        {/* 7. Contacto */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            7. Contacto
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Si tienes dudas, comentarios o sugerencias sobre esta política de
            privacidad, por favor comunícate con nosotros mediante la sección de
            Contacto dentro de la app. En Aura Sonora creemos en el diálogo
            abierto y en la construcción de una comunidad respetuosa y segura.
          </ThemedText>
        </View>
      </View>

      {/* Última actualización */}
      <ThemedText
        style={{
          marginTop: 30,
          fontSize: 14,
          textAlign: "center",
          color: "gray",
        }}
      >
        Última actualización: 24 de diciembre de 2025
      </ThemedText>

      {/* Botón */}
      <View style={{ alignItems: "center", marginTop: 40 }}>
        {/* <View className="flex-row mt-7 justify-between"> */}
        <ThemedButton onPress={() => router.back()}>Volver</ThemedButton>
      </View>
    </ScrollView>
  );
}
