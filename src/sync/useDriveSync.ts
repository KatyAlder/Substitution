import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { AppState } from "../types/state";
import { isConfigured, signIn as googleSignIn, signOut as googleSignOut } from "./googleAuth";
import { createStateFile, findStateFile, getFileMeta, loadStateFile, uploadStateFile } from "./googleDrive";
import { pickNewer } from "./pickNewer";

export type SyncStatus = "off" | "local" | "saving" | "ok" | "error";

const SAVE_DEBOUNCE_MS = 1500;
const RETRY_MS = 10000;

export interface SyncControls {
  status: SyncStatus;
  message: string | null;
  enabled: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

export function useDriveSync(state: AppState, setState: Dispatch<SetStateAction<AppState>>): SyncControls {
  const enabled = isConfigured();
  const [status, setStatus] = useState<SyncStatus>(enabled ? "local" : "off");
  const [message, setMessage] = useState<string | null>(null);
  const fileIdRef = useRef<string | null>(null);
  const lastModifiedRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const push = useCallback(async () => {
    const fileId = fileIdRef.current;
    if (!fileId) return;
    try {
      setStatus("saving");
      setMessage(null);
      const meta = await getFileMeta(fileId);
      if (meta.modifiedTime !== lastModifiedRef.current) {
        const remote = await loadStateFile(fileId);
        const merged = pickNewer(stateRef.current, remote);
        if (merged !== stateRef.current) {
          setMessage("Дані оновились з іншого пристрою");
          setState(merged);
          return;
        }
      }
      const uploaded = await uploadStateFile(fileId, stateRef.current);
      lastModifiedRef.current = uploaded.modifiedTime;
      setStatus("ok");
    } catch {
      setStatus("error");
      saveTimerRef.current = setTimeout(push, RETRY_MS);
    }
  }, [setState]);

  useEffect(() => {
    if (!fileIdRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setStatus("saving");
    saveTimerRef.current = setTimeout(push, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, push]);

  const signIn = useCallback(async () => {
    setStatus("saving");
    try {
      await googleSignIn();
      const existing = await findStateFile();
      if (existing) {
        fileIdRef.current = existing.id;
        lastModifiedRef.current = existing.modifiedTime;
        const remote = await loadStateFile(existing.id);
        const merged = pickNewer(stateRef.current, remote);
        if (merged !== remote) {
          const uploaded = await uploadStateFile(existing.id, merged);
          lastModifiedRef.current = uploaded.modifiedTime;
        }
        if (merged !== stateRef.current) setState(merged);
      } else {
        const created = await createStateFile(stateRef.current);
        fileIdRef.current = created.id;
        lastModifiedRef.current = created.modifiedTime;
      }
      setStatus("ok");
    } catch (error) {
      setStatus("error");
      fileIdRef.current = null;
      throw error;
    }
  }, [setState]);

  const signOut = useCallback(() => {
    googleSignOut();
    fileIdRef.current = null;
    lastModifiedRef.current = null;
    setMessage(null);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setStatus("local");
  }, []);

  return { status, message, enabled, signIn, signOut };
}
