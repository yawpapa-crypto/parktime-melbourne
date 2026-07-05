import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme, typeColors } from "../../theme/tokens";

export function ParkBadge({ label, tone = "paid" }: { label: string; tone?: keyof typeof typeColors }) {
  const colors = typeColors[tone] ?? typeColors.paid;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primary, disabled && styles.disabled, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      <Text style={styles.primaryText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  primary: { backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  primaryText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.9 },
});
