import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/colors";

type Props = {
  name: string;
  image?: string | null;
  company?: boolean;
  large?: boolean;
};

export function ChatIdentity({ name, image, company = true, large }: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const failed = failedImage === image;
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, company && styles.company]}>
        {image && !failed ? (
          <Image
            source={{ uri: image }}
            accessibilityLabel={company ? "Logo da " + name : "Foto de " + name}
            onError={() => setFailedImage(image ?? null)}
            resizeMode={company ? "contain" : "cover"}
            style={styles.image}
          />
        ) : (
          <Ionicons
            name={company ? "business-outline" : "person-outline"}
            size={large ? 23 : 20}
            color={colors.mutedForeground}
          />
        )}
      </View>
      <Text style={[styles.name, large && styles.large]} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  company: { backgroundColor: colors.background },
  image: { width: "100%", height: "100%" },
  name: {
    flexShrink: 1,
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "700",
  },
  large: { fontSize: 15, paddingRight: spacing.sm },
});
