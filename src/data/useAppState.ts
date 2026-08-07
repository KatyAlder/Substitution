import { useEffect, useState } from "react";
import type { AppState } from "../types/state";
import { loadState, saveState } from "./storage";

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  return [state, setState] as const;
}
