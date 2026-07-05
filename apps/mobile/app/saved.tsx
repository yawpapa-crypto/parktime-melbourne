import { StyleSheet, Text, View } from "react-native";
import { EmptyState } from "../src/components/ui/states";
import { theme } from "../src/theme/tokens";

export default function SavedScreen() {
  return (
    <View style={styles.root}>
      <EmptyState title="No saved places yet" description="Save parking locations from the map detail sheet." />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: theme.background } });
