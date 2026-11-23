import Constants from "expo-constants";

type Extra = {
  environment?: "development" | "production";
  apiUrl?: string;
  webUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const trim = (value: string | undefined) =>
  String(value ?? "").replace(/\/+$/, "");

export const environment = extra.environment ?? "development";
export const apiBaseUrl = trim(extra.apiUrl);
export const webBaseUrl = trim(extra.webUrl);
