export const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  const encoded = encodeURIComponent(value);
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${name}=${encoded}; max-age=${maxAge}; path=/; SameSite=Lax${secureAttr}`;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1]);
};

export const removeCookie = (name: string) => {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax${secureAttr}`;
};

export const getStoredUser = <T = any>(): T | null => {
  if (typeof document === "undefined") return null;
  const rawUser = getCookie("user");
  if (rawUser) {
    try {
      return JSON.parse(rawUser) as T;
    } catch (e) {
      // fall through to token decode
    }
  }

  // Fallback: decode user info from JWT token cookie
  const token = getCookie("token");
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    const jsonPayload = JSON.parse(decoded);
    return jsonPayload as T;
  } catch (e) {
    return null;
  }
};

export const clearAuthStorage = () => {
  removeCookie("token");
  removeCookie("user");
};
