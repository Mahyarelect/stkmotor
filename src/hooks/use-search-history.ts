"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "stk_recent_searches";
const MAX_HISTORY = 8;

function getStoredHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_HISTORY);
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(getStoredHistory);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore write error
      }
      return next;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item !== query);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore write error
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore write error
    }
  }, []);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
  };
}
