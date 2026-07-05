import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../src/theme/tokens";

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={{ color: "white", fontWeight: "700" }}>AM</Text></View>
        <View>
          <Text style={styles.name}>Alex Mitchell</Text>
          <Text style={styles.sub}>Melbourne, VIC</Text>
        </View>
      </View>
      {["Notification settings", "Sign scanner", "Council coverage", "Help and feedback"].map((item) => (
        <View key={item} style={styles.row}><Text>{item}</Text></View>
      ))}
      <Text style={styles.sub}>ParkTime Melbourne v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: theme.card, padding: 16, borderRadius: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 17, fontWeight: "600" },
  sub: { fontSize: 13, color: theme.muted },
  row: { backgroundColor: theme.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
});
