import { useCallback, useEffect, useState, type SetStateAction } from "react";
import type { AppState } from "../types/state";
import { loadState, saveState } from "./storage";

export function useAppState() {
  const [state, setStateRaw] = useState<AppState>(() => loadState());

  const setState = useCallback((update: SetStateAction<AppState>) => {
    setStateRaw((prev) => {
      const next = typeof update === "function" ? (update as (prev: AppState) => AppState)(prev) : update;
      return { ...next, meta: { updatedAt: Date.now() } };
    });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return [state, setState] as const;
}
