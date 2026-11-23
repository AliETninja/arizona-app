import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { postDriverSelfieStatus } from "@/api/driverSelfie";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/session/AuthProvider";
import { colors, spacing } from "@/theme/colors";

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (name: IconName) =>
  function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return (
      <Ionicons
        name={name}
        color={focused ? colors.primary : colors.mutedForeground}
        size={size}
      />
    );
  };

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
  if (selfie.data.needsSelfie)
    return <Screen title="PRIMEIRO ACESSO DO MOTORISTA" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Corridas", tabBarIcon: icon("navigate-outline") }}
      />
      <Tabs.Screen
        name="ofertas"
        options={{ title: "Viagens", tabBarIcon: icon("cube-outline") }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Chat", tabBarIcon: icon("chatbubbles-outline") }}
      />
      <Tabs.Screen
        name="historico"
        options={{ title: "Histórico", tabBarIcon: icon("time-outline") }}
      />
    </Tabs>
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
