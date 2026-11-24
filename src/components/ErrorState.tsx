import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { colors, spacing, typography } from "@/theme/colors";

type Props = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.box}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button
          label="Tentar novamente"
          variant="outline"
          size="sm"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  message: {
    ...typography.small,
    color: colors.error,
    textAlign: "center",
  },
});
