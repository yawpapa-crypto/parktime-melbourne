import type { ConfigContext, ExpoConfig } from "expo/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

loadEnv({ path: resolve(__dirname, "../../.env") });
loadEnv({ path: resolve(__dirname, ".env") });

import appJson from "./app.json";

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...appJson.expo,
  ...config,
  extra: {
    ...appJson.expo.extra,
    ...config.extra,
    mapboxAccessToken: mapboxToken,
    apiBaseUrl,
  },
  plugins: [
    [
      "@rnmapbox/maps",
      process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN
        ? { RNMapboxMapsDownloadToken: process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN }
        : {},
    ],
    "expo-router",
    "expo-location",
    "expo-dev-client",
  ],
});
