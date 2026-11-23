import { StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";

type Props = TextInputProps & { label: string };

export function TextField({ label, style, ...input }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, style]}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { color: colors.foreground, fontSize: 14, fontWeight: "600" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.base,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.background,
    fontSize: 16,
  },
});
