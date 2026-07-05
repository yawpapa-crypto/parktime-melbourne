import Constants from "expo-constants";
import Mapbox from "@rnmapbox/maps";

const extra = Constants.expoConfig?.extra as { mapboxAccessToken?: string } | undefined;
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? extra?.mapboxAccessToken;

if (token && !token.includes("your_")) {
  Mapbox.setAccessToken(token);
}

export { Mapbox };
