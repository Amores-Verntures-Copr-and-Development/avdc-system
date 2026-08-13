"use client";

import { useCallback, useEffect, useState } from "react";

// Wraps the browser Fullscreen API for kiosk-style displays (tablets showing
// a customer-facing menu) - lets the page hide browser chrome (address bar,
// tabs) so it reads like a dedicated kiosk screen instead of a website.
export function useFullscreen<T extends HTMLElement = HTMLElement>(
  targetRef?: React.RefObject<T | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof document !== "undefined" &&
        Boolean(document.documentElement.requestFullscreen),
    );

    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));

    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const enter = useCallback(async () => {
    const el = targetRef?.current ?? document.documentElement;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit]);

  return { isFullscreen, isSupported, enter, exit, toggle };
}
