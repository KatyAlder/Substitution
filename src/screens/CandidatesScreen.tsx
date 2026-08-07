import { useMemo, useState } from "react";
import { SlotPicker } from "../components/SlotPicker";
import { TierSection } from "../components/TierSection";
import { useAppState } from "../data/useAppState";
import { weekdayName } from "../ranking/presence";
import { TIERS, rankCandidates } from "../ranking/rank";

export function CandidatesScreen() {
  const [state] = useAppState();

  const openSubstitutions = useMemo(
    () => state.substitutions.filter((s) => s.status === "open"),
    [state.substitutions]
  );

  const [selectedId, setSelectedId] = useState<string | null>(openSubstitutions[0]?.id ?? null);
  const selected = openSubstitutions.find((s) => s.id === selectedId) ?? null;

  const result = useMemo(() => (selected ? rankCandidates(state, selected) : null), [state, selected]);
  const absentTeacher = selected ? state.teachers.find((t) => t.id === selected.absentTeacherId) : undefined;

  return (
    <main className="screen">
      <h1 className="screen__title">Активні заміни</h1>

      {openSubstitutions.length === 0 ? (
        <p className="screen__empty">Немає відкритих замін.</p>
      ) : (
        <SlotPicker
          substitutions={openSubstitutions}
          teachers={state.teachers}
          bells={state.bells}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {selected && result && (
        <>
          <div className="slot-summary">
            <div className="slot-summary__main">
              {weekdayName(result.weekday)}, {selected.date} · {selected.class} клас
              {result.subject ? ` · ${result.subject}` : ""}
            </div>
            <div className="slot-summary__absent">відсутній: {absentTeacher?.name ?? selected.absentTeacherId}</div>
            {result.labApplicable && (
              <div className={`slot-summary__lab${result.labAvailable ? "" : " slot-summary__lab--busy"}`}>
                лабораторія {result.room ?? "?"}: {result.labAvailable ? "вільна" : "зайнята іншим уроком"}
              </div>
            )}
          </div>

          {TIERS.map((tier) => (
            <TierSection
              key={tier}
              tier={tier}
              candidates={result.tiers[tier]}
              labApplicable={result.labApplicable}
              labAvailable={result.labAvailable}
            />
          ))}
        </>
      )}
    </main>
  );
}
