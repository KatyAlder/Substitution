import { useState } from "react";
import { dateToWeekday, weekdayName } from "../ranking/presence";
import { GROUP_CHAT_INVITE_URL } from "../config/settings";
import type { Substitution } from "../types/substitution";
import { buildBroadcastMessage } from "../whatsapp";

interface Props {
  substitutions: Substitution[];
  onMarkAllInChat: () => void;
  onDelete: (id: string) => void;
}

export function BroadcastPanel({ substitutions, onMarkAllInChat, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const message = buildBroadcastMessage(substitutions);

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="broadcast-panel">
      <h2 className="broadcast-panel__title">Завчасні заміни очікують розсилки ({substitutions.length})</h2>
      <ul className="broadcast-panel__list">
        {substitutions.map((sub) => {
          return (
            <li key={sub.id} className="broadcast-panel__item">
              <span>
                {weekdayName(dateToWeekday(sub.date))}, {sub.date} ·{" "}
                {`${sub.start}–${sub.end}`} · {sub.class} клас
              </span>
              <button
                type="button"
                className="slot-picker__delete"
                title="Видалити заміну"
                aria-label="Видалити заміну"
                onClick={() => onDelete(sub.id)}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
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
