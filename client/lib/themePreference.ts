import { userAPI } from "@/lib/api";
import { getCookie, getStoredUser, setCookie } from "@/lib/cookies";

export type ThemePreference = "light" | "dark" | "system";

export function persistThemePreference(theme: ThemePreference) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem("theme", theme);

    const user = getStoredUser<any>();
    if (user) {
      const nextUser = {
        ...user,
        theme,
        preferences: {
          ...(user.preferences || {}),
          theme,
        },
      };

      setCookie("user", JSON.stringify(nextUser), 7);
      window.localStorage.setItem("user", JSON.stringify(nextUser));
    }

    if (getCookie("token")) {
      userAPI.updatePreferences({ theme }).catch(() => {
        // Keep the local preference. The next successful profile sync will reconcile.
      });
    }
  } catch {
    // Theme switching should never fail the UI.
  }
}
