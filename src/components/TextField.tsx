import { StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { colors, radius, spacing } from "@/theme/colors";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  multiline?: boolean;
};

export function TextField({ label, error, multiline, style, ...input }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          styles.input,
          multiline && styles.multiline,
          error ? styles.invalid : null,
          style,
        ]}
        {...input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  multiline: {
    minHeight: 120,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm + 4,
  },
  invalid: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 13 },
});
