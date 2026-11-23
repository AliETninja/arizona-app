import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "link";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
}: Props) {
  const blocked = Boolean(loading || disabled);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" ? styles.primary : styles.link,
        (pressed || blocked) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" ? colors.primaryForeground : colors.primary
          }
        />
      ) : (
        <Text
          style={variant === "primary" ? styles.primaryLabel : styles.linkLabel}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  link: { backgroundColor: "transparent" },
  dimmed: { opacity: 0.7 },
  primaryLabel: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
  linkLabel: { color: colors.primary, fontSize: 15, fontWeight: "600" },
});
