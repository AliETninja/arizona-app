import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/session/AuthProvider";
import { colors, spacing, typography } from "@/theme/colors";

type Props = { title: string; subtitle?: string; children?: ReactNode };

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { signOut } = useAuth();
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <Text style={styles.eyebrow}>APP DO MOTORISTA</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={signOut}>
          <Text style={styles.exit}>Sair</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Screen({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScreenHeader title={title} subtitle={subtitle} />
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

export const screenStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
});

const styles = StyleSheet.create({
  safe: screenStyles.safe,
  header: { padding: spacing.md, gap: spacing.xs },
  eyebrow: { ...typography.eyebrow, color: colors.primary },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exit: { color: colors.mutedForeground, fontSize: 14, fontWeight: "600" },
  title: { ...typography.title, color: colors.foreground },
  subtitle: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20 },
  body: { flex: 1, paddingHorizontal: spacing.md },
});
