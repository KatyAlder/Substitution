import { CONSECUTIVE_REFUSALS_THRESHOLD } from "../config/settings";
import type { RankedCandidate } from "../ranking/rank";
import type { Attempt, AttemptResult } from "../types/substitution";

interface Props {
  candidate: RankedCandidate;
  labApplicable: boolean;
  labAvailable: boolean;
  whatsappUrl?: string;
  latestAttempt?: Attempt;
  onResult: (result: AttemptResult) => void;
}

const ATTEMPT_LABELS: Record<AttemptResult, string> = {
  agreed: "погодився",
  refused: "відмовився",
  silent: "не відповів",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

export function CandidateCard({ candidate, labApplicable, labAvailable, whatsappUrl, latestAttempt, onResult }: Props) {
  const { teacher, lessonsToday, substitutionsThisMonth, consecutiveRefusals, inGoldenHour, bonusCount } = candidate;

  return (
    <li className={`candidate-card${bonusCount > 0 ? " candidate-card--bonus" : ""}`}>
      <div className="candidate-card__name">
        {teacher.name}
        {teacher.isHourly && <span className="badge">погодинник</span>}
        {inGoldenHour && <span className="badge badge--gold">золота година</span>}
      </div>
      <dl className="candidate-card__stats">
        <div>
          <dt>уроків сьогодні</dt>
          <dd>{lessonsToday}</dd>
        </div>
        <div>
          <dt>замін за місяць</dt>
          <dd>{substitutionsThisMonth}</dd>
        </div>
        <div>
          <dt>відмов поспіль</dt>
          <dd className={consecutiveRefusals >= CONSECUTIVE_REFUSALS_THRESHOLD ? "value--warn" : undefined}>
            {consecutiveRefusals}
          </dd>
        </div>
        <div>
          <dt>золота година</dt>
          <dd className={inGoldenHour ? "value--good" : undefined}>{inGoldenHour ? "✓" : "—"}</dd>
        </div>
        {labApplicable && (
          <div>
            <dt>авдиторія</dt>
            <dd className={labAvailable ? "value--good" : "value--warn"}>
              {labAvailable ? "✓" : "без лабораторії"}
            </dd>
          </div>
        )}
      </dl>

      <div className="candidate-card__actions">
        {whatsappUrl ? (
          <a className="btn btn--whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        ) : (
          <span className="btn btn--disabled" title="немає номера телефону">
            WhatsApp
          </span>
        )}
        <button type="button" className="btn btn--agree" onClick={() => onResult("agreed")}>
          Погодився
        </button>
        <button type="button" className="btn btn--refuse" onClick={() => onResult("refused")}>
          Відмовився
        </button>
        <button type="button" className="btn btn--silent" onClick={() => onResult("silent")}>
          Не відповів
        </button>
      </div>

      {latestAttempt && (
        <div className={`candidate-card__attempt candidate-card__attempt--${latestAttempt.result}`}>
          {ATTEMPT_LABELS[latestAttempt.result]} о {formatTime(latestAttempt.at)}
        </div>
      )}
    </li>
  );
}
