import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Mapbox } from "../src/lib/mapbox";
import { api, type NearbyBay, type SearchResult } from "../src/services/api";
import { EmptyState, ErrorState, LoadingState } from "../src/components/ui/states";
import { ParkBadge, PrimaryButton } from "../src/components/parking/park-badge";
import { theme, typeColors } from "../src/theme/tokens";

export default function MapScreen() {
  const cameraRef = useRef<Mapbox.Camera>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [destination, setDestination] = useState<SearchResult | null>(null);
  const [bays, setBays] = useState<NearbyBay[]>([]);
  const [selected, setSelected] = useState<NearbyBay | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const sessionToken = useRef(String(Date.now()));

  const center = useMemo(
    () => destination ?? { latitude: -37.8136, longitude: 144.9631 },
    [destination],
  );

  const loadNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.nearby({ latitude: lat, longitude: lng, radius: 500 });
      setBays(res.results);
      if (!res.results.length) setSelected(null);
    } catch (e) {
      setError(String(e));
      setBays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNearby(center.latitude, center.longitude);
  }, [center.latitude, center.longitude, loadNearby]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(query, sessionToken.current);
        setSuggestions(res.results);
        if (res.error) setError(res.error);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectPlace = async (place: SearchResult) => {
    Keyboard.dismiss();
    setQuery(place.placeFormatted || place.name);
    setSuggestions([]);
    setDestination(place);
    cameraRef.current?.setCamera({
      centerCoordinate: [place.longitude, place.latitude],
      zoomLevel: 15,
      animationDuration: 800,
    });
    await loadNearby(place.latitude, place.longitude);
  };

  const locateMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setDestination({ id: "me", name: "Current location", placeFormatted: "Current location", featureType: "location", latitude: lat, longitude: lng });
      cameraRef.current?.setCamera({ centerCoordinate: [lng, lat], zoomLevel: 15, animationDuration: 800 });
      await loadNearby(lat, lng);
    } catch (e) {
      setError(String(e));
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.root}>
      <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Street}>
        <Mapbox.Camera ref={cameraRef} zoomLevel={14} centerCoordinate={[center.longitude, center.latitude]} />
        {destination && (
          <Mapbox.PointAnnotation id="destination" coordinate={[destination.longitude, destination.latitude]}>
            <View style={styles.destMarker} />
          </Mapbox.PointAnnotation>
        )}
        {bays.map((bay) => (
          <Mapbox.PointAnnotation
            key={bay.id}
            id={bay.id}
            coordinate={[bay.longitude, bay.latitude]}
            onSelected={() => setSelected(bay)}
          >
            <View style={[styles.bayMarker, { backgroundColor: typeColors.paid.hex }]} />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search street, suburb or destination"
          placeholderTextColor={theme.muted}
          style={styles.input}
          accessibilityLabel="Search destination"
        />
        <Pressable onPress={locateMe} style={styles.iconBtn} accessibilityLabel="Locate me">
          <Text>{locating ? "…" : "◎"}</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable key={s.id} onPress={() => selectPlace(s)} style={styles.suggestionRow}>
              <Text style={styles.suggestionTitle}>{s.name}</Text>
              <Text style={styles.suggestionSub}>{s.placeFormatted}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Parking near you</Text>
        {loading ? <LoadingState message="Finding parking within 500 m…" /> : null}
        {error ? <ErrorState message={error} onRetry={() => loadNearby(center.latitude, center.longitude)} /> : null}
        {!loading && !error && bays.length === 0 ? (
          <EmptyState title="No parking found" description="Try another location or widen your search." />
        ) : null}
        {!loading && !error && bays.length > 0 ? (
          <FlatList
            data={bays}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => setSelected(item)}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.streetDescription}</Text>
                <Text style={styles.cardSub}>{item.distanceMetres} m · {item.rule.leaveBy ?? item.rule.currentRule}</Text>
                <ParkBadge label={item.rule.currentRule.split(" · ")[0] ?? "Parking"} />
              </Pressable>
            )}
          />
        ) : null}
      </View>

      {selected && (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{selected.streetDescription}</Text>
          <ParkBadge label={selected.rule.currentRule} />
          <Text style={styles.detailMeta}>Leave by {selected.rule.leaveBy ?? "—"}</Text>
          <Text style={styles.detailMeta}>Source: {selected.source} · {selected.sourceUpdatedAt ?? "unknown"}</Text>
          <Text style={styles.warning}>Always check the physical parking sign.</Text>
          <PrimaryButton title="Start parking timer" onPress={() => {}} />
          <Pressable onPress={() => setSelected(null)} accessibilityLabel="Close detail">
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  map: { flex: 1 },
  searchBar: { position: "absolute", top: 56, left: 16, right: 16, flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, borderWidth: 1, borderColor: theme.border },
  iconBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border },
  suggestions: { position: "absolute", top: 120, left: 16, right: 72, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, maxHeight: 220 },
  suggestionRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  suggestionTitle: { fontSize: 14, fontWeight: "600", color: theme.foreground },
  suggestionSub: { fontSize: 12, color: theme.muted, marginTop: 2 },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: 160, borderTopWidth: 1, borderColor: theme.border },
  sheetTitle: { fontSize: 14, fontWeight: "700", color: theme.foreground, marginBottom: 4 },
  card: { width: 200, backgroundColor: theme.background, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: theme.border, gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: "600" },
  cardSub: { fontSize: 11, color: theme.muted },
  detail: { position: "absolute", left: 16, right: 16, bottom: 180, backgroundColor: theme.card, borderRadius: 20, padding: 16, gap: 8, borderWidth: 1, borderColor: theme.border },
  detailTitle: { fontSize: 18, fontWeight: "700" },
  detailMeta: { fontSize: 13, color: theme.muted },
  warning: { fontSize: 11, color: theme.warning, backgroundColor: "#FEF3C7", padding: 8, borderRadius: 8 },
  close: { textAlign: "center", color: theme.muted, marginTop: 8 },
  destMarker: { width: 18, height: 18, borderRadius: 9, backgroundColor: theme.accent, borderWidth: 3, borderColor: "white" },
  bayMarker: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "white" },
});
