import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUnreadCount } from "@/features/chat/useUnreadCount";
import { colors } from "@/theme/colors";

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

export default function TabsLayout() {
  const unread = useUnreadCount();
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
        options={{
          title: "Chat",
          tabBarIcon: icon("chatbubbles-outline"),
          tabBarBadge: unread > 0 ? unread : undefined,
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{ title: "Histórico", tabBarIcon: icon("time-outline") }}
      />
    </Tabs>
  );
}
