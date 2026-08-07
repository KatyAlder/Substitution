import { TIER_LABELS, type RankedCandidate, type Tier } from "../ranking/rank";
import { CandidateCard } from "./CandidateCard";

interface Props {
  tier: Tier;
  candidates: RankedCandidate[];
  labApplicable: boolean;
  labAvailable: boolean;
}

export function TierSection({ tier, candidates, labApplicable, labAvailable }: Props) {
  if (candidates.length === 0) return null;

  return (
    <section className="tier-section">
      <h2 className="tier-section__title">
        Тир {tier}
        <span className="tier-section__label">{TIER_LABELS[tier]}</span>
      </h2>
      <ul className="candidate-list">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.teacher.id}
            candidate={candidate}
            labApplicable={labApplicable}
            labAvailable={labAvailable}
          />
        ))}
      </ul>
    </section>
  );
}
