import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

export default function TermsAndConditions() {
  const background = useThemeColor({}, "background");
  const router = useRouter();

  // 💡 Cuando el usuario acepta los términos
  const handleAccept = () => {
    Alert.alert(
      "✅ ¡Gracias por aceptar!",
      "Ahora puedes consultar nuestra Política de Privacidad.",
      [
        {
          text: "Ver Política",
          onPress: () => router.push("/library/modal/privacy-policy"),
        },
        {
          text: "Cerrar",
          style: "cancel",
        },
      ]
    );
  };

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
        Términos y Condiciones de Uso — Aura Sonora
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
        Bienvenido a{" "}
        <ThemedText style={{ fontWeight: "600" }}>Aura Sonora</ThemedText>, una
        aplicación desarrollada para conectar a los oyentes con las mejores
        emisoras de radio en vivo y podcasts de la República Dominicana y del
        mundo. Al utilizar nuestros servicios, aceptas los siguientes términos y
        condiciones. Te pedimos leerlos detenidamente antes de continuar.
      </ThemedText>

      {/* Secciones */}
      <View style={{ gap: 24 }}>
        {/* 1. Aceptación de los términos */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            1. Aceptación de los Términos
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Al acceder y utilizar la aplicación Aura Sonora, aceptas cumplir con
            estos Términos y Condiciones, así como con nuestra Política de
            Privacidad. Si no estás de acuerdo con alguna parte de estos
            términos, te pedimos que no utilices la aplicación ni nuestros
            servicios.
          </ThemedText>
        </View>

        {/* 2. Uso de la aplicación */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            2. Uso de la Aplicación
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Aura Sonora está diseñada exclusivamente para fines personales y no
            comerciales. Te comprometes a no utilizar la app de forma que pueda
            dañar, desactivar o interferir con su correcto funcionamiento. El
            contenido disponible, como emisoras, podcasts y audios, es propiedad
            de sus respectivos titulares y se presenta únicamente con fines de
            difusión y entretenimiento.
          </ThemedText>
        </View>

        {/* 3. Registro de usuario */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            3. Registro de Usuario
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Para acceder a ciertas funciones, como crear una lista de favoritos,
            guardar historial o participar en comunidades, podrías necesitar
            crear una cuenta. Eres responsable de mantener la confidencialidad
            de tus credenciales y de todas las actividades que ocurran bajo tu
            cuenta. Aura Sonora no se hace responsable por accesos no
            autorizados derivados de negligencia del usuario.
          </ThemedText>
        </View>

        {/* 4. Contenido y derechos */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            4. Contenido y Propiedad Intelectual
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Todo el contenido presentado en Aura Sonora —incluyendo textos,
            imágenes, logotipos, audios, interfaces y diseño— es propiedad de
            Aura Sonora o de sus respectivos propietarios con licencia. Está
            prohibido reproducir, distribuir, modificar o utilizar el contenido
            sin autorización expresa. Aura Sonora actúa como plataforma de
            distribución y no reclama propiedad sobre los contenidos de
            terceros.
          </ThemedText>
        </View>

        {/* 5. Enlaces y contenido externo */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            5. Enlaces y Contenido Externo
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Nuestra aplicación puede incluir enlaces o transmisiones desde
            terceros (por ejemplo, emisoras o plataformas de podcasts externas).
            Aura Sonora no controla ni se responsabiliza por la disponibilidad,
            exactitud o políticas de dichos servicios externos. Al acceder a
            ellos, aceptas sus propios términos y condiciones.
          </ThemedText>
        </View>

        {/* 6. Responsabilidad del usuario */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            6. Responsabilidad del Usuario
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Te comprometes a utilizar Aura Sonora de forma ética y respetuosa,
            evitando comentarios ofensivos, spam o cualquier acción que pueda
            afectar a otros usuarios o al funcionamiento del sistema. Aura
            Sonora se reserva el derecho de suspender cuentas o limitar acceso
            en caso de detectar comportamientos inapropiados.
          </ThemedText>
        </View>

        {/* 7. Limitación de responsabilidad */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            7. Limitación de Responsabilidad
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Aura Sonora no garantiza que el servicio esté libre de errores o
            interrupciones. No nos hacemos responsables de pérdidas de datos,
            problemas de conexión, o cualquier daño derivado del uso de la
            aplicación. Sin embargo, trabajamos continuamente para ofrecer la
            mejor experiencia posible con actualizaciones regulares y soporte
            técnico dedicado.
          </ThemedText>
        </View>

        {/* 8. Modificaciones del servicio */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            8. Modificaciones del Servicio
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Aura Sonora se reserva el derecho de modificar, suspender o eliminar
            funciones de la aplicación sin previo aviso. Cualquier cambio será
            reflejado en las versiones más recientes de la app y comunicado a
            los usuarios cuando sea relevante.
          </ThemedText>
        </View>

        {/* 9. Cambios en los términos */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            9. Cambios en los Términos
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Podemos actualizar estos términos de uso en cualquier momento para
            reflejar cambios en la legislación o en nuestros servicios. Las
            modificaciones entrarán en vigor una vez publicadas. Se recomienda
            revisar periódicamente esta sección para mantenerte informado.
          </ThemedText>
        </View>

        {/* 10. Contacto */}
        <View>
          <ThemedText
            style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}
          >
            10. Contacto
          </ThemedText>
          <ThemedText style={{ lineHeight: 22 }}>
            Si tienes preguntas sobre estos términos o sobre el uso de la app,
            puedes comunicarte con nuestro equipo a través del formulario de
            contacto o mediante los canales oficiales de Aura Sonora. Estaremos
            encantados de ayudarte.
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

      <View className="flex-row mt-7 justify-between">
        <ThemedButton onPress={handleAccept}>
          Aceptar Términos y Continuar
        </ThemedButton>

        <ThemedButton
          onPress={() => router.back()}
          // variant="secondary"
          className="mt-2"
        >
          Cancelar
        </ThemedButton>
      </View>
      {/* <View className="flex-row mt-7 justify-between">
				<ThemedButton onPress={() => router.back()}>Volver</ThemedButton>
				<ThemedButton
					onPress={() => router.push("/library/modal/privacy-policy")}
				>
					Aceptar
				</ThemedButton>
			</View> */}
    </ScrollView>
  );
}
