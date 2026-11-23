import * as SecureStore from "expo-secure-store";

const tokenKey = "arizona.session.token";

let current: string | null = null;

export const sessionToken = {
  get: () => current,
  async load() {
    try {
      current = await SecureStore.getItemAsync(tokenKey);
    } catch {
      current = null;
    }
    return current;
  },
  async set(token: string) {
    current = token;
    try {
      await SecureStore.setItemAsync(tokenKey, token);
    } catch {
      return;
    }
  },
  async clear() {
    current = null;
    try {
      await SecureStore.deleteItemAsync(tokenKey);
    } catch {
      return;
    }
  },
};
