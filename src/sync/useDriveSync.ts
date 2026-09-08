import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState } from "../types/state";
import {
  AuthExpiredError,
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
// Поки вкладка відкрита — раз на хвилину звіряємо мітку файлу в Drive. Ловить
// випадок "обидва пристрої відкриті одночасно, правки на одному".
const POLL_MS = 60000;

export interface SyncControls {
  status: SyncStatus;
  message: string | null;
  enabled: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

export function useDriveSync(state: AppState, applyRemote: (snapshot: AppState) => void): SyncControls {
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
  // true, поки триває звіряння з Drive — щоб focus + visibilitychange, які
  // прилітають разом, не робили два запити.
  const pullingRef = useRef(false);
  // Наступний прохід ефекту [state] пропускає планування push — стан щойно
  // прийшов із Drive, слати його назад не треба.
  const skipNextPushRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Застосувати підтягнутий знімок і не відсилати його назад у Drive.
  const applyRemoteSnapshot = useCallback(
    (snapshot: AppState) => {
      skipNextPushRef.current = true;
      applyRemote(snapshot);
    },
    [applyRemote],
  );

  const push = useCallback(async () => {
    saveTimerRef.current = null;
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
          lastModifiedRef.current = meta.modifiedTime;
          setMessage("Дані оновились з іншого пристрою");
          applyRemoteSnapshot(merged);
          setStatus("ok");
          return;
        }
      }
      const uploaded = await uploadStateFile(fileId, stateRef.current);
      lastModifiedRef.current = uploaded.modifiedTime;
      setStatus("ok");
    } catch (error) {
      // Сесія Google протухла — не глухий кут із повтором кожні 10 с, а чиста
      // пропозиція увійти знову (кнопка "Увійти через Google").
      if (error instanceof AuthExpiredError) {
        fileIdRef.current = null;
        lastModifiedRef.current = null;
        setMessage("Сесія Google протухла — увійдіть знову");
        setStatus("local");
        return;
      }
      setStatus("error");
      saveTimerRef.current = setTimeout(push, RETRY_MS);
    }
  }, [applyRemoteSnapshot]);

  // Звірити мітку файлу в Drive і, якщо його змінив інший пристрій, підтягнути
  // + злити. Не чіпає нічого, поки є незбережені локальні правки (їх допише
  // звичайний push, який робить те саме злиття перед заливанням).
  const pullIfRemoteChanged = useCallback(async () => {
    if (pullingRef.current || saveTimerRef.current) return;
    const fileId = fileIdRef.current;
    if (!fileId) return;
    pullingRef.current = true;
    try {
      const meta = await getFileMeta(fileId);
      if (meta.modifiedTime === lastModifiedRef.current) return;
      const remote = await loadStateFile(fileId);
      const merged = pickNewer(stateRef.current, remote);
      if (merged !== stateRef.current) {
        lastModifiedRef.current = meta.modifiedTime;
        setMessage("Дані оновились з іншого пристрою");
        applyRemoteSnapshot(merged);
        setStatus("ok");
      }
      // Локальний стан новіший — lastModifiedRef не чіпаємо, звичайний push
      // сам зробить pull-merge-upload при наступній правці.
    } catch (error) {
      if (error instanceof AuthExpiredError) {
        fileIdRef.current = null;
        lastModifiedRef.current = null;
        setMessage("Сесія Google протухла — увійдіть знову");
        setStatus("local");
      }
      // мережева заминка — просто спробуємо наступного разу (фокус чи опитувач)
    } finally {
      pullingRef.current = false;
    }
  }, [applyRemoteSnapshot]);

  useEffect(() => {
    if (!fileIdRef.current) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setStatus("saving");
    saveTimerRef.current = setTimeout(push, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, push]);

  // Підтягування, коли вкладка знову стає активною (перемкнулись між
  // пристроями) і легкий опитувач, поки вона відкрита.
  useEffect(() => {
    if (!enabled) return;
    const pullIfVisible = () => {
      if (document.visibilityState === "visible") void pullIfRemoteChanged();
    };
    document.addEventListener("visibilitychange", pullIfVisible);
    window.addEventListener("focus", pullIfVisible);
    const interval = setInterval(pullIfVisible, POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", pullIfVisible);
      window.removeEventListener("focus", pullIfVisible);
      clearInterval(interval);
    };
  }, [enabled, pullIfRemoteChanged]);

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
      if (merged !== stateRef.current) applyRemoteSnapshot(merged);
    } else {
      const created = await createStateFile(stateRef.current);
      fileIdRef.current = created.id;
      lastModifiedRef.current = created.modifiedTime;
    }
  }, [applyRemoteSnapshot]);

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
      } catch (error) {
        if (cancelled) return;
        fileIdRef.current = null;
        if (error instanceof AuthExpiredError) setMessage("Сесія Google протухла — увійдіть знову");
        setStatus("local");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, attachToDrive]);

  const signIn = useCallback(async () => {
    setStatus("saving");
    setMessage(null);
    try {
      await googleSignIn();
      await attachToDrive();
      setStatus("ok");
    } catch (error) {
      fileIdRef.current = null;
      if (error instanceof AuthExpiredError) {
        setMessage("Не вдалося підтвердити доступ до Google Drive — спробуйте ще раз");
        setStatus("local");
        return;
      }
      setStatus("error");
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
