import { CONSECUTIVE_REFUSALS_THRESHOLD } from "../config/settings";
import type { RankedCandidate } from "../ranking/rank";

interface Props {
  candidate: RankedCandidate;
  labApplicable: boolean;
  labAvailable: boolean;
}

export function CandidateCard({ candidate, labApplicable, labAvailable }: Props) {
  const { teacher, lessonsToday, substitutionsThisMonth, consecutiveRefusals, inGoldenHour, bonusCount } = candidate;

  return (
    <li className={`candidate-card${bonusCount > 0 ? " candidate-card--bonus" : ""}`}>
      <div className="candidate-card__name">
        {teacher.name}
        {teacher.isHourly && <span className="badge">погодинник</span>}
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
    </li>
  );
}
