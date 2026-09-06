import type { AppState } from "../types/state";
import { AuthExpiredError, getAccessToken, invalidateAccessToken } from "./googleAuth";

const FILE_NAME = "zaminy-state.json";

export interface DriveFileRef {
  id: string;
  modifiedTime: string;
}

async function driveFetch(url: string, init: RequestInit = {}, retried = false): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers });
  if (response.ok) return response;

  // 401 = Google не приймає токен (відкликано чи протух достроково — наш
  // кеш цього не бачить). Раз скидаємо кеш, беремо свіжий токен і повторюємо;
  // якщо і свіжий дає 401 — сесія справді мертва, потрібен видимий вхід.
  if (response.status === 401) {
    if (retried) throw new AuthExpiredError();
    invalidateAccessToken();
    try {
      await getAccessToken(true);
    } catch {
      throw new AuthExpiredError();
    }
    return driveFetch(url, init, true);
  }
  throw new Error(`Google Drive API: ${response.status}`);
}

export async function findStateFile(): Promise<DriveFileRef | null> {
  const query = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const response = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,modifiedTime)&spaces=drive`,
  );
  const json = (await response.json()) as { files?: DriveFileRef[] };
  return json.files?.[0] ?? null;
}

export async function createStateFile(state: AppState): Promise<DriveFileRef> {
  const boundary = `zaminy-${Date.now()}`;
  const metadata = { name: FILE_NAME, mimeType: "application/json" };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(state)}\r\n--${boundary}--`;
  const response = await driveFetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime",
    { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body },
  );
  return (await response.json()) as DriveFileRef;
}

export async function loadStateFile(fileId: string): Promise<AppState> {
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  return (await response.json()) as AppState;
}

export async function getFileMeta(fileId: string): Promise<{ modifiedTime: string }> {
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`);
  return (await response.json()) as { modifiedTime: string };
}

export async function uploadStateFile(fileId: string, state: AppState): Promise<DriveFileRef> {
  const response = await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=modifiedTime`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) },
  );
  return (await response.json()) as DriveFileRef;
}
