const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface GoogleTokenClient {
  callback: (response: GoogleTokenResponse) => void;
  requestAccessToken: (options: { prompt: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

let tokenClient: GoogleTokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiry = 0;

export function isConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

function gisReady(): boolean {
  return Boolean(window.google?.accounts?.oauth2);
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisReady()) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-gis]");
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Не вдалося завантажити Google Identity Services")), {
      once: true,
    });
    if (!existing) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.gis = "1";
      document.head.appendChild(script);
    }
  });
}

async function ensureTokenClient(): Promise<GoogleTokenClient> {
  if (tokenClient) return tokenClient;
  await loadGisScript();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("VITE_GOOGLE_CLIENT_ID не задано");
  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_FILE_SCOPE,
    callback: () => {},
  });
  return tokenClient;
}

async function requestToken(interactive: boolean): Promise<string> {
  const client = await ensureTokenClient();
  return new Promise<string>((resolve, reject) => {
    client.callback = (response) => {
      if (response.error || !response.access_token) {
        reject(new Error(response.error ?? "Немає токена доступу"));
        return;
      }
      accessToken = response.access_token;
      tokenExpiry = Date.now() + ((response.expires_in ?? 0) - 60) * 1000;
      resolve(accessToken);
    };
    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  });
}

export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  try {
    return await requestToken(false);
  } catch {
    return await requestToken(true);
  }
}

export async function signIn(): Promise<void> {
  await requestToken(true);
}

export function signOut(): void {
  if (accessToken && gisReady()) {
    window.google!.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
  tokenClient = null;
}
