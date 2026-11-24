import type { ConfigContext, ExpoConfig } from "expo/config";

const identifier = "br.com.arizonalog.app";

const easProjectId = "dd991b96-e31b-4930-80c5-e57e253cc52f";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Arizona Log",
  slug: "arizonalog",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "arizonalog",
  userInterfaceStyle: "light",
  runtimeVersion: { policy: "appVersion" },
  updates: { url: "https://u.expo.dev/" + easProjectId },
  ios: {
    supportsTablet: false,
    bundleIdentifier: identifier,
    infoPlist: {
      UIBackgroundModes: ["location", "fetch", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: identifier,
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
    eas: { projectId: easProjectId },
  },
});
