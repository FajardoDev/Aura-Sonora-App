import ThemedText from "@/presentation/theme/components/themed-text";
import ThemedButton from "@/presentation/theme/components/ThemedButton";
import { useThemeColor } from "@/presentation/theme/hooks/use-theme-color";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

export default function ModalPantallaSobreNosotros() {
  const background = useThemeColor({}, "background");
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: background,
        paddingVertical: 30,
        paddingHorizontal: 22,
        paddingBottom: 170,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Título principal */}
      <ThemedText
        style={{
          fontSize: 24,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Acerca de Aura Sonora
      </ThemedText>

      {/* Introducción */}
      <ThemedText
        style={{
          fontSize: 16,
          lineHeight: 24,
          textAlign: "center",
          marginBottom: 28,
          opacity: 0.9,
        }}
      >
        Aura Sonora es una plataforma dominicana que conecta a los oyentes con
        emisoras de radio en vivo, podcasts locales y contenido cultural de todo
        el país y del mundo. Nuestro objetivo es ofrecer una experiencia fluida,
        humana y llena de ritmo, donde cada usuario descubra nuevas voces,
        historias y sonidos sin límites geográficos.
      </ThemedText>

      {/* Nuestra Misión */}
      <Section
        title="Nuestra Misión"
        text={`Brindar una experiencia auditiva moderna, accesible y diversa que una a las personas a través del sonido. 
En Aura Sonora creemos que la radio y los podcasts son puentes culturales que inspiran, educan y conectan corazones. 
Queremos ofrecerte un espacio donde la tecnología se combine con la pasión por comunicar.`}
      />

      {/* Nuestros Valores */}
      <Section title="Nuestros Valores" />

      <ValueItem
        title="🎧 Accesibilidad"
        text="Creamos una plataforma fácil de usar para que cualquier persona, sin importar su edad o lugar, pueda escuchar contenido de calidad."
      />
      <ValueItem
        title="🚀 Innovación"
        text="Apostamos por la tecnología más reciente para ofrecer transmisiones rápidas, estables y con un diseño intuitivo."
      />
      <ValueItem
        title="🌎 Cultura"
        text="Celebramos la diversidad sonora dominicana y global, conectando emisoras locales con audiencias internacionales."
      />
      <ValueItem
        title="🤝 Comunidad"
        text="Creemos en el poder de la comunidad. Los oyentes y creadores son el alma de Aura Sonora, y juntos construimos un espacio lleno de ideas, música y aprendizaje."
      />

      {/* Nuestro Equipo */}
      <Section
        title="Nuestro Equipo"
        text={`Detrás de Aura Sonora hay un grupo de desarrolladores, comunicadores y apasionados por la música. 
Cada línea de código y cada frecuencia reflejan nuestro compromiso por ofrecerte una experiencia auditiva impecable, optimizada y cercana.`}
      />

      {/* CTA final */}
      <Section
        title="¿Tienes Preguntas o Sugerencias?"
        text={`Estamos aquí para escucharte. Si tienes alguna idea o deseas comunicarte con nosotros, visita nuestra sección de contacto o escríbenos directamente. 
Tu opinión nos ayuda a seguir mejorando y creando la mejor experiencia auditiva posible.`}
      />

      {/* Botón de acción */}
      <View style={{ marginTop: 32, alignItems: "center" }}>
        <ThemedButton onPress={() => router.back()}>Cerrar</ThemedButton>
      </View>
    </ScrollView>
  );
}

/** Subcomponente para secciones con título y texto */
function Section({ title, text }: { title: string; text?: string }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <ThemedText style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        {title}
      </ThemedText>
      {text && (
        <ThemedText style={{ fontSize: 15, lineHeight: 22, opacity: 0.85 }}>
          {text}
        </ThemedText>
      )}
    </View>
  );
}

/** Subcomponente para valores individuales */
function ValueItem({ title, text }: { title: string; text: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
        {title}
      </ThemedText>
      <ThemedText style={{ fontSize: 15, opacity: 0.85, lineHeight: 22 }}>
        {text}
      </ThemedText>
    </View>
  );
}
