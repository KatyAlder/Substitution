import { TIER_LABELS, type RankedCandidate, type Tier } from "../ranking/rank";
import type { Attempt, AttemptResult } from "../types/substitution";
import { buildWhatsAppUrl } from "../whatsapp";
import { CandidateCard } from "./CandidateCard";

interface Props {
  tier: Tier;
  candidates: RankedCandidate[];
  labApplicable: boolean;
  labAvailable: boolean;
  whatsappMessage: string;
  attempts: Attempt[];
  onResult: (teacherId: string, result: AttemptResult) => void;
}

export function TierSection({
  tier,
  candidates,
  labApplicable,
  labAvailable,
  whatsappMessage,
  attempts,
  onResult,
}: Props) {
  if (candidates.length === 0) return null;

  return (
    <section className="tier-section">
      <h2 className="tier-section__title">
        Тир {tier}
        <span className="tier-section__label">{TIER_LABELS[tier]}</span>
      </h2>
      <ul className="candidate-list">
        {candidates.map((candidate) => {
          const latestAttempt = attempts
            .filter((a) => a.teacherId === candidate.teacher.id)
            .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))[0];

          return (
            <CandidateCard
              key={candidate.teacher.id}
              candidate={candidate}
              labApplicable={labApplicable}
              labAvailable={labAvailable}
              whatsappUrl={buildWhatsAppUrl(candidate.teacher, whatsappMessage)}
              latestAttempt={latestAttempt}
              onResult={(result) => onResult(candidate.teacher.id, result)}
            />
          );
        })}
      </ul>
    </section>
  );
}
