const USER_STORAGE_KEY = "user";

function normalizeStoredUser(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;

  const user = raw as Record<string, any>;

  return {
    id: user.id ?? user._id ?? null,
    _id: user._id ?? user.id ?? null,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role ?? "buyer",
    isVerified: Boolean(user.isVerified),
    approvalStatus: user.approvalStatus,
    isApproved: Boolean(user.isApproved),
    accountStatus: user.accountStatus ?? "active",
    bannedReason: user.bannedReason,
    profilePictureUrl: user.profilePictureUrl,
    avatar: user.avatar,
    phone: user.phone,
    authProvider: user.authProvider,
    preferences: user.preferences?.theme
      ? { theme: user.preferences.theme }
      : user.preferences,
  };
}

function parseStoredUserValue<T = any>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === "undefined") return;

  let valueToStore = value;
  if (name === USER_STORAGE_KEY) {
    const parsed = parseStoredUserValue(value);
    const normalized = normalizeStoredUser(parsed);
    valueToStore = JSON.stringify(normalized ?? parsed ?? value);

    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, valueToStore);
    }
  }

  const maxAge = days * 24 * 60 * 60;
  const encoded = encodeURIComponent(valueToStore);
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
  if (name === USER_STORAGE_KEY && typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureAttr = isSecure ? "; Secure" : "";
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax${secureAttr}`;
};

export const getStoredUser = <T = any>(): T | null => {
  if (typeof document === "undefined") return null;

  if (typeof window !== "undefined") {
    const localUser = parseStoredUserValue<T>(localStorage.getItem(USER_STORAGE_KEY));
    if (localUser) {
      return localUser;
    }
  }

  const rawUser = getCookie("user");
  if (rawUser) {
    const cookieUser = parseStoredUserValue<T>(rawUser);
    if (cookieUser) {
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(cookieUser));
      }
      return cookieUser;
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
