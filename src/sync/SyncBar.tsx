import { useSyncStatus } from "../data/AppStateContext";

const STATUS_LABEL: Record<string, string> = {
  local: "локально",
  saving: "зберігаю…",
  ok: "збережено",
  error: "помилка",
};

export function SyncBar() {
  const { status, message, enabled, signIn, signOut } = useSyncStatus();

  if (!enabled) return null;

  const signedIn = status !== "local";

  return (
    <div className="sync-bar">
      <span className={`sync-bar__dot sync-bar__dot--${status}`} />
      <span className="sync-bar__text">{STATUS_LABEL[status] ?? status}</span>
      {message && <span className="sync-bar__message">{message}</span>}
      <button
        type="button"
        className="sync-bar__btn"
        onClick={() => {
          if (signedIn) signOut();
          else void signIn();
        }}
      >
        {signedIn ? "Вийти" : "Увійти через Google"}
      </button>
    </div>
  );
}
