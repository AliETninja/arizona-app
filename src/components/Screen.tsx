import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/session/AuthProvider";
import { colors, spacing } from "@/theme/colors";

type Props = { title: string; subtitle?: string; children?: ReactNode };

export function Screen({ title, subtitle, children }: Props) {
  const { signOut } = useAuth();
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
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
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { padding: spacing.md, gap: spacing.xs },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exit: { color: colors.mutedForeground, fontSize: 14, fontWeight: "600" },
  title: { color: colors.foreground, fontSize: 24, fontWeight: "700" },
  subtitle: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20 },
  body: { flex: 1, paddingHorizontal: spacing.md },
});
