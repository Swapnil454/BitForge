"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const EXIT_SENTINEL_KEY = "__bitforgeDoubleBackExit";
const APP_EXIT_DEPTH_KEY = "__bitforgeAppExitDepth";

function cloneHistoryState() {
  try {
    return structuredClone(window.history.state || {});
  } catch {
    try {
      return JSON.parse(JSON.stringify(window.history.state || {}));
    } catch {
      return {};
    }
  }
}

function createBaseState() {
  const state = cloneHistoryState();
  delete state[EXIT_SENTINEL_KEY];
  return state;
}

function createSentinelState(baseState = createBaseState()) {
  return {
    ...baseState,
    [EXIT_SENTINEL_KEY]: true,
  };
}

export function useDoubleBackToExit({
  enabled,
  message = "Press back again to exit",
  timeoutMs = 1500,
  internalExitDepth = 2,
}: {
  enabled: boolean;
  message?: string;
  timeoutMs?: number;
  internalExitDepth?: number;
}) {
  const lastBackPressRef = useRef(0);
  const exitingRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    exitingRef.current = false;

    const currentUrl = () =>
      `${window.location.pathname}${window.location.search}${window.location.hash}`;

    const rememberExitDepth = () => {
      const state = window.history.state || {};
      if (typeof state[APP_EXIT_DEPTH_KEY] === "number") {
        return state[APP_EXIT_DEPTH_KEY];
      }

      const previousDepth = Number(window.sessionStorage.getItem(APP_EXIT_DEPTH_KEY) || "0");
      const nextDepth = Math.max(previousDepth, internalExitDepth);
      window.sessionStorage.setItem(APP_EXIT_DEPTH_KEY, String(nextDepth));
      return nextDepth;
    };

    const armTrap = ({ fresh = false } = {}) => {
      if (exitingRef.current) return;

      const state = window.history.state || {};
      if (state[EXIT_SENTINEL_KEY] && !fresh) {
        return;
      }

      const baseState = createBaseState();
      baseState[APP_EXIT_DEPTH_KEY] = rememberExitDepth();
      if (fresh || state[EXIT_SENTINEL_KEY]) {
        window.history.replaceState(baseState, "", currentUrl());
      }
      window.history.pushState(createSentinelState(baseState), "", currentUrl());
    };

    const releaseAndExit = () => {
      exitingRef.current = true;
      const state = window.history.state || {};
      const exitDepth =
        typeof state[APP_EXIT_DEPTH_KEY] === "number"
          ? state[APP_EXIT_DEPTH_KEY]
          : Number(window.sessionStorage.getItem(APP_EXIT_DEPTH_KEY) || internalExitDepth);

      window.history.go(-Math.max(1, exitDepth));
    };

    const handleFirstBack = () => {
      lastBackPressRef.current = Date.now();
      toast(message, {
        id: "double-back-exit",
        icon: "↩",
        duration: timeoutMs,
        style: {
          borderRadius: "12px",
          background: "#1e293b",
          color: "#fff",
        },
      });
      armTrap();
    };

    function handlePopState() {
      if (exitingRef.current) return;

      const now = Date.now();
      const isDoubleBack = now - lastBackPressRef.current <= timeoutMs;

      if (isDoubleBack) {
        releaseAndExit();
        return;
      }

      handleFirstBack();
    }

    function handlePageShow() {
      exitingRef.current = false;
      lastBackPressRef.current = 0;
      window.setTimeout(() => armTrap({ fresh: true }), 0);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        window.setTimeout(armTrap, 0);
      }
    }

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.setTimeout(() => armTrap({ fresh: true }), 0);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, internalExitDepth, message, timeoutMs]);
}
