/** Storage access that never throws (private mode, blocked storage, SSR). */
export function readJSON<T>(storage: "local" | "session", key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(storage: "local" | "session", key: string, value: unknown): void {
  try {
    if (typeof window === "undefined") return;
    const s = storage === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state lives in memory for this page view */
  }
}
