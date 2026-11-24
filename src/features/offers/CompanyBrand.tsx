import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography } from "@/theme/colors";

type Props = { companyName?: string; logoUrl?: string };

export function CompanyBrand({ companyName, logoUrl }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl === logoUrl;
  const name = companyName || "Empresa anunciante";
  return (
    <View style={styles.brand}>
      <View style={styles.logo}>
        {logoUrl && !failed ? (
          <Image
            source={{ uri: logoUrl }}
            accessibilityLabel={"Logo da " + name}
            resizeMode="contain"
            style={styles.image}
            onError={() => setFailedUrl(logoUrl ?? null)}
          />
        ) : (
          <Ionicons name="business-outline" size={25} color="#9c7830" />
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.caption}>EMPRESA ANUNCIANTE</Text>
        <Text style={styles.name}>{name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: {
    width: 52,
    height: 52,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9d4c8",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  text: { flex: 1, gap: 5 },
  caption: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.foreground,
    opacity: 0.65,
  },
  name: { ...typography.subheading, color: colors.foreground, lineHeight: 21 },
});
