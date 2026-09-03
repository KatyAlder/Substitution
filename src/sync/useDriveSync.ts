import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { AppState } from "../types/state";
import {
  getAccessToken,
  isConfigured,
  signIn as googleSignIn,
  signOut as googleSignOut,
  wasSignedIn,
} from "./googleAuth";
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
  // Якщо користувач уже входив — стартуємо з "saving": тихе відновлення сесії
  // нижче або підхопить її без вікна, або відкотить на "local".
  const [status, setStatus] = useState<SyncStatus>(
    enabled ? (wasSignedIn() ? "saving" : "local") : "off",
  );
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

  // Прив'язка до файлу в Drive: знайти наявний і злити, або створити новий.
  // Спільна частина видимого входу й тихого відновлення сесії при старті.
  const attachToDrive = useCallback(async () => {
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
  }, [setState]);

  // Тихе відновлення при старті: якщо користувач уже входив на цьому пристрої і
  // сесія Google ще жива — підхоплюємо токен без вікна й одразу синхронізуємось.
  // Якщо сесія згасла — просто лишаємось на "local" (кнопка "Увійти").
  // Гард — уже прив'язаний файл, а не "лише раз": так подвійний виклик ефекту в
  // StrictMode коректно перезапускає скасований прохід замість зависання.
  useEffect(() => {
    if (!enabled || fileIdRef.current || !wasSignedIn()) return;
    let cancelled = false;
    void (async () => {
      setStatus("saving");
      try {
        await getAccessToken();
        if (cancelled) return;
        await attachToDrive();
        if (cancelled) return;
        setStatus("ok");
      } catch {
        if (cancelled) return;
        fileIdRef.current = null;
        setStatus("local");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, attachToDrive]);

  const signIn = useCallback(async () => {
    setStatus("saving");
    try {
      await googleSignIn();
      await attachToDrive();
      setStatus("ok");
    } catch (error) {
      setStatus("error");
      fileIdRef.current = null;
      throw error;
    }
  }, [attachToDrive]);

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
