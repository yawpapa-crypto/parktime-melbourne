import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { api, type NearbyBay } from "../src/services/api";
import { EmptyState, ErrorState, LoadingState } from "../src/components/ui/states";
import { ParkBadge } from "../src/components/parking/park-badge";
import { theme } from "../src/theme/tokens";

export default function NearbyScreen() {
  const [bays, setBays] = useState<NearbyBay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState("Closest");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const coords = status === "granted"
        ? await Location.getCurrentPositionAsync({})
        : null;
      const lat = coords?.coords.latitude ?? -37.8136;
      const lng = coords?.coords.longitude ?? 144.9631;
      const res = await api.nearby({ latitude: lat, longitude: lng, radius: 800 });
      setBays(res.results);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.root}>
      <View style={styles.chips}>
        {["Closest", "Longest parking", "Cheapest"].map((s) => (
          <Pressable key={s} onPress={() => setSort(s)} style={[styles.chip, sort === s && styles.chipActive]}>
            <Text style={[styles.chipText, sort === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && bays.length === 0 ? <EmptyState title="No nearby parking" /> : null}
      <FlatList
        data={bays}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.streetDescription}</Text>
              <Text style={styles.sub}>{item.suburb} · {item.distanceMetres} m</Text>
              <Text style={styles.sub}>Leave by {item.rule.leaveBy ?? "—"} · {item.rule.estimatedCost != null ? `$${item.rule.estimatedCost}` : item.rule.paymentRequired ? "Paid" : "Free"}</Text>
            </View>
            <ParkBadge label={item.rule.currentRule.split(" · ")[0] ?? "Parking"} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  chips: { flexDirection: "row", gap: 8, padding: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderColor: theme.border },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
  chipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText: { fontSize: 12, color: theme.foreground },
  chipTextActive: { color: "white" },
  row: { backgroundColor: theme.card, borderRadius: 16, padding: 16, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: theme.border },
  title: { fontSize: 14, fontWeight: "600" },
  sub: { fontSize: 12, color: theme.muted, marginTop: 2 },
});
