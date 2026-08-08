import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AppState } from "../types/state";
import { useDriveSync, type SyncControls } from "../sync/useDriveSync";
import { useAppState as useLocalAppState } from "./useAppState";

type AppStateTuple = readonly [AppState, Dispatch<SetStateAction<AppState>>];

const AppStateCtx = createContext<AppStateTuple | null>(null);
const SyncCtx = createContext<SyncControls | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const tuple = useLocalAppState();
  const [state, setState] = tuple;
  const sync = useDriveSync(state, setState);

  return (
    <AppStateCtx.Provider value={tuple}>
      <SyncCtx.Provider value={sync}>{children}</SyncCtx.Provider>
    </AppStateCtx.Provider>
  );
}

export function useAppState(): AppStateTuple {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState має викликатися всередині AppStateProvider");
  return ctx;
}

export function useSyncStatus(): SyncControls {
  const ctx = useContext(SyncCtx);
  if (!ctx) throw new Error("useSyncStatus має викликатися всередині AppStateProvider");
  return ctx;
}
