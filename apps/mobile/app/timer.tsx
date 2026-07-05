import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../src/theme/tokens";

export default function TimerScreen() {
  const [secs, setSecs] = useState(6120);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const color = secs > 1800 ? theme.accent : secs > 900 ? theme.warning : theme.destructive;

  return (
    <View style={styles.root}>
      <Text style={styles.header}>Active session</Text>
      <Text style={styles.sub}>Little Lonsdale Street, CBD</Text>
      <Text style={[styles.timer, { color }]}>{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}</Text>
      <Text style={styles.sub}>Leave by 6:30 pm</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background, alignItems: "center", paddingTop: 40, gap: 8 },
  header: { fontSize: 20, fontWeight: "700", color: theme.foreground },
  sub: { fontSize: 13, color: theme.muted },
  timer: { fontSize: 48, fontWeight: "700", marginVertical: 24 },
});
