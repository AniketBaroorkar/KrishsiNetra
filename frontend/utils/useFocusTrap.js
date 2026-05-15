"use client";

import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
  );
}

export function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive) return undefined;
    const container = ref.current;
    if (!container) return undefined;

    const previousActive = document.activeElement;
    const focusables = getFocusable(container);
    if (focusables[0]) focusables[0].focus();

    function handleKey(event) {
      if (event.key !== "Tab") return;
      const items = getFocusable(container);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      if (previousActive instanceof HTMLElement) previousActive.focus();
    };
  }, [ref, isActive]);
}
