import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, tints } from "@/theme/colors";

export type BadgeVariant =
  "primary" | "destructive" | "outline" | "secondary" | "success" | "warning";

type Props = { label: string; variant?: BadgeVariant };

const palette: Record<
  BadgeVariant,
  { background: string; border: string; text: string }
> = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.primaryForeground,
  },
  destructive: {
    background: tints.error,
    border: tints.errorBorder,
    text: colors.error,
  },
  secondary: {
    background: colors.secondary,
    border: colors.secondary,
    text: colors.secondaryForeground,
  },
  outline: {
    background: "transparent",
    border: colors.border,
    text: colors.foreground,
  },
  success: {
    background: tints.success,
    border: tints.successBorder,
    text: colors.success,
  },
  warning: {
    background: tints.warning,
    border: tints.warningBorder,
    text: colors.warning,
  },
};

export function Badge({ label, variant = "primary" }: Props) {
  const tone = palette[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: tone.background, borderColor: tone.border },
      ]}
    >
      <Text style={[styles.label, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  label: { fontSize: 13, fontWeight: "500", lineHeight: 17 },
});
