import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme/tokens";

export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator color={theme.primary} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.text}>{description}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={[styles.title, { color: theme.destructive }]}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 16, fontWeight: "600", color: theme.foreground, textAlign: "center" },
  text: { fontSize: 14, color: theme.muted, textAlign: "center" },
  button: { marginTop: 8, backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  buttonText: { color: "white", fontWeight: "600" },
});
