import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEYS = {
  transactions: "@bolso/transactions/v1",
  recurring: "@bolso/recurring/v1",
  categories: "@bolso/categories/v1",
  settings: "@bolso/settings/v1",
  chat: "@bolso/chat/v1",
} as const;

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function saveJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
