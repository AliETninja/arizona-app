import { Pressable, StyleSheet, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Spinner } from "@/components/Spinner";
import { colors, radius, spacing } from "@/theme/colors";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const palette: Record<
  ButtonVariant,
  { background: string; border: string; text: string }
> = {
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.primaryForeground,
  },
  secondary: {
    background: colors.secondary,
    border: colors.secondary,
    text: colors.secondaryForeground,
  },
  outline: {
    background: "transparent",
    border: colors.primary,
    text: colors.primary,
  },
  ghost: {
    background: "transparent",
    border: "transparent",
    text: colors.primary,
  },
  link: {
    background: "transparent",
    border: "transparent",
    text: colors.primary,
  },
  destructive: {
    background: colors.error,
    border: colors.error,
    text: colors.errorForeground,
  },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  style,
}: Props) {
  const blocked = Boolean(loading || disabled);
  const tone = palette[variant];
  const small = size === "sm";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: Boolean(loading) }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        small ? styles.small : styles.medium,
        variant === "link" && styles.linkBase,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
        },
        pressed && styles.pressed,
        blocked && styles.blocked,
        style,
      ]}
    >
      {loading ? (
        <Spinner size="sm" color={tone.text} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={small ? 16 : 20} color={tone.text} />
          ) : null}
          <Text
            style={[
              small ? styles.smallLabel : styles.label,
              { color: tone.text },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.base,
  },
  medium: { minHeight: 48, paddingHorizontal: spacing.md },
  small: { minHeight: 36, paddingHorizontal: spacing.sm + 4 },
  linkBase: { borderWidth: 0 },
  pressed: { opacity: 0.8 },
  blocked: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: "600" },
  smallLabel: { fontSize: 14, fontWeight: "500" },
});
