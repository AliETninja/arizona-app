import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { postDriverSelfieStatus } from "@/api/driverSelfie";
import { Button } from "@/components/Button";
import { SelfieGate } from "@/features/selfie/SelfieGate";
import { useAuth } from "@/session/AuthProvider";
import { colors, spacing } from "@/theme/colors";

export default function DriverLayout() {
  const { state } = useAuth();
  const userId = state.type === "signedIn" ? state.user.id : 0;
  const selfie = useQuery({
    queryKey: ["driver-selfie", userId],
    queryFn: postDriverSelfieStatus,
  });

  if (selfie.isPending)
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  if (selfie.isError)
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{selfie.error.message}</Text>
        <Button label="Tentar novamente" onPress={() => selfie.refetch()} />
      </View>
    );
  if (selfie.data.needsSelfie) return <SelfieGate />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="corrida/[tripId]" />
      <Stack.Screen name="negociacao/[opportunityId]" />
    </Stack>
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
