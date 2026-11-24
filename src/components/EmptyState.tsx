import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, typography } from "@/theme/colors";

type Props = {
  title: string;
  text?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function EmptyState({ title, text, icon }: Props) {
  return (
    <View style={styles.box}>
      {icon ? <Ionicons name={icon} size={34} color={colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.base,
    paddingVertical: 45,
    paddingHorizontal: 25,
  },
  title: { ...typography.bodyStrong, color: colors.foreground },
  text: {
    ...typography.small,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
