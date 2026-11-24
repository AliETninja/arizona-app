import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { AuthProvider, useAuth } from "@/session/AuthProvider";
import { colors, spacing } from "@/theme/colors";
import "@/tracking/registerTrackingTask";

function Navigation() {
  const { state, retry } = useAuth();
  if (state.type === "loading")
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  if (state.type === "unavailable")
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Não foi possível entrar. Tente novamente.
        </Text>
        <Button label="Tentar novamente" onPress={retry} />
      </View>
    );
  const signedIn = state.type === "signedIn";
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(driver)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, staleTime: 5000 } },
      }),
  );
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Navigation />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  message: { color: colors.foreground, fontSize: 16, textAlign: "center" },
});
