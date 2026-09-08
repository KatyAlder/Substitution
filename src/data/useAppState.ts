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

  // Застосувати знімок, підтягнутий із Drive, — БЕЗ перештамповування
  // meta.updatedAt. Інакше щойно підтягнутий чужий стан позначився б як
  // "створений зараз", pickNewer втратив би змогу порівняти справжній час
  // авторства, і два активні пристрої пінг-понгали б записами.
  const applyRemoteState = useCallback((remote: AppState) => {
    setStateRaw(remote);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return [state, setState, applyRemoteState] as const;
}
