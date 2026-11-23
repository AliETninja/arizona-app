import type { ConfigContext, ExpoConfig } from "expo/config";

type Environment = "development" | "production";

const environment: Environment =
  process.env.APP_ENV === "production" ? "production" : "development";

const settings = {
  development: {
    name: "Arizona Log-dev",
    scheme: "arizonalog-dev",
    identifier: "br.com.arizonalog.app.dev",
    apiUrl: "https://ms-arizona-dev-c6hgw5heia-rj.a.run.app",
    webUrl: "https://ms-arizona-web-dev-c6hgw5heia-rj.a.run.app",
  },
  production: {
    name: "Arizona Log",
    scheme: "arizonalog",
    identifier: "br.com.arizonalog.app",
    apiUrl: "",
    webUrl: "https://arizonalog.com.br",
  },
}[environment];

const easProjectId = process.env.EAS_PROJECT_ID ?? "";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: settings.name,
  slug: "arizona-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: settings.scheme,
  userInterfaceStyle: "light",
  runtimeVersion: { policy: "appVersion" },
  updates: easProjectId
    ? { url: "https://u.expo.dev/" + easProjectId }
    : undefined,
  ios: {
    supportsTablet: false,
    bundleIdentifier: settings.identifier,
    infoPlist: {
      UIBackgroundModes: ["location", "fetch", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: settings.identifier,
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-font",
    "expo-splash-screen",
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "A Arizona Log usa sua localização durante a corrida, inclusive com o app fechado, para monitorar a viagem.",
        locationWhenInUsePermission:
          "A Arizona Log usa sua localização para monitorar a viagem.",
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "A Arizona Log usa a câmera para tirar a sua foto de perfil.",
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    ["expo-notifications", { color: "#92702d" }],
  ],
  experiments: { typedRoutes: true },
  extra: {
    environment,
    apiUrl: settings.apiUrl,
    webUrl: settings.webUrl,
    eas: easProjectId ? { projectId: easProjectId } : undefined,
  },
});
