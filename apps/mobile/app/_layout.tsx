import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { theme } from "../src/theme/tokens";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.primary,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Map", headerShown: false }} />
        <Tabs.Screen name="nearby" options={{ title: "Nearby" }} />
        <Tabs.Screen name="saved" options={{ title: "Saved" }} />
        <Tabs.Screen name="timer" options={{ title: "Timer" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </>
  );
}
