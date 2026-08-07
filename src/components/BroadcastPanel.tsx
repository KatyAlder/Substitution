import { useState } from "react";
import { GROUP_CHAT_INVITE_URL } from "../config/settings";
import type { Bell } from "../types/schedule";
import type { Substitution } from "../types/substitution";
import { buildBroadcastMessage } from "../whatsapp";

interface Props {
  substitutions: Substitution[];
  bells: Bell[];
  onMarkAllInChat: () => void;
}

export function BroadcastPanel({ substitutions, bells, onMarkAllInChat }: Props) {
  const [copied, setCopied] = useState(false);
  const message = buildBroadcastMessage(substitutions, bells);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="broadcast-panel">
      <h2 className="broadcast-panel__title">Завчасні заміни очікують розсилки ({substitutions.length})</h2>
      <pre className="broadcast-panel__text">{message}</pre>
      <div className="broadcast-panel__actions">
        <button type="button" className="btn" onClick={handleCopy}>
          {copied ? "Скопійовано" : "Копіювати текст"}
        </button>
        {GROUP_CHAT_INVITE_URL && (
          <a className="btn" href={GROUP_CHAT_INVITE_URL} target="_blank" rel="noreferrer">
            Відкрити чат
          </a>
        )}
        <button type="button" className="btn btn--agree" onClick={onMarkAllInChat}>
          Позначити всі як "в чаті"
        </button>
      </div>
    </section>
  );
}
