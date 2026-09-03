const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

// Токен доступу Google живе ~1 годину й без refresh-токена (клієнтський потік).
// Зберігаємо його разом із часом дії, щоб оновлення сторінки в межах години не
// вимагало навіть тихого запиту; окремий прапорець "користувач входив" живе до
// явного виходу й вмикає тихе відновлення сесії при старті застосунку.
const TOKEN_KEY = "zaminy-google-token-v1";
const SIGNED_IN_KEY = "zaminy-google-signedin-v1";

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface GoogleErrorResponse {
  type?: string;
  message?: string;
}

interface GoogleTokenClient {
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: GoogleErrorResponse) => void;
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
            error_callback?: (error: GoogleErrorResponse) => void;
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
let pendingReject: ((reason: Error) => void) | null = null;

function hydrateFromStorage(): void {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { token?: string; expiry?: number };
    if (parsed.token && typeof parsed.expiry === "number" && Date.now() < parsed.expiry) {
      accessToken = parsed.token;
      tokenExpiry = parsed.expiry;
    }
  } catch {
    // пошкоджений запис — ігноруємо, отримаємо новий токен
  }
}
hydrateFromStorage();

function persistToken(token: string, expiry: number): void {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiry }));
    localStorage.setItem(SIGNED_IN_KEY, "1");
  } catch {
    // приватний режим / переповнене сховище — працюємо без збереження
  }
}

function clearStorage(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SIGNED_IN_KEY);
  } catch {
    // ignore
  }
}

export function isConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
}

/** Чи входив користувач раніше на цьому пристрої (до явного "Вийти"). */
export function wasSignedIn(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === "1";
  } catch {
    return false;
  }
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
    // Спрацьовує, коли GIS не може видати токен без вікна, а вікно відкрити ніде
    // (тихий виклик поза жестом користувача) — інакше проміс завис би назавжди.
    error_callback: (error) => {
      pendingReject?.(new Error(error?.type ?? "Помилка входу Google"));
      pendingReject = null;
    },
  });
  return tokenClient;
}

// Скільки чекати на тихий токен. GIS при згаслій сесії Google все одно пробує
// відкрити вікно; поза жестом користувача воно блокується мовчки — ні callback,
// ні error_callback не приходять, тож проміс завис би без цього обмеження.
const SILENT_TIMEOUT_MS = 6000;

async function requestToken(prompt: "" | "none"): Promise<string> {
  const client = await ensureTokenClient();
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      pendingReject = null;
      run();
    };
    const timer =
      prompt === "none"
        ? setTimeout(() => finish(() => reject(new Error("Тихий вхід не вдався"))), SILENT_TIMEOUT_MS)
        : null;
    pendingReject = (reason) => finish(() => reject(reason));
    client.callback = (response) => {
      if (response.error || !response.access_token) {
        finish(() => reject(new Error(response.error ?? "Немає токена доступу")));
        return;
      }
      const token = response.access_token;
      accessToken = token;
      tokenExpiry = Date.now() + ((response.expires_in ?? 0) - 60) * 1000;
      persistToken(token, tokenExpiry);
      finish(() => resolve(token));
    };
    client.requestAccessToken({ prompt });
  });
}

/**
 * Токен для запиту до Drive. Повертає кешований, поки він чинний; інакше просить
 * новий тихо (`prompt: "none"` — без вікна). Кидає помилку, якщо сесія Google
 * згасла й потрібен видимий вхід — тоді викликач має показати кнопку "Увійти".
 */
export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  return requestToken("none");
}

/** Видимий вхід за жестом користувача (кнопка). Вікно акаунта — лише за потреби. */
export async function signIn(): Promise<void> {
  await requestToken("");
}

export function signOut(): void {
  if (accessToken && gisReady()) {
    window.google!.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
  tokenClient = null;
  clearStorage();
}
