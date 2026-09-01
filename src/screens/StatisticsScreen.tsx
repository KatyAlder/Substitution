import { useMemo, useState } from "react";
import { useAppState } from "../data/AppStateContext";
import { currentMonth, monthLabel } from "../profile/stats";
import { dateToWeekday, weekdayName } from "../ranking/presence";
import { slotBell } from "../ranking/levels";
import { deadEndsForMonth, shiftMonth, teacherMonthlyRows } from "../stats/schoolStats";

export function StatisticsScreen() {
  const [state] = useAppState();
  const [month, setMonth] = useState(currentMonth());

  const rows = useMemo(() => teacherMonthlyRows(state, month), [state, month]);
  const deadEnds = useMemo(() => deadEndsForMonth(state, month), [state, month]);

  return (
    <main className="screen">
      <h1 className="screen__title">Статистика</h1>

      <div className="stats-controls">
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="попередній місяць">
          ◀
        </button>
        <span className="stats-controls__label">{monthLabel(month)}</span>
        <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="наступний місяць">
          ▶
        </button>
      </div>

      <section className="profile-section">
        <h2 className="profile-section__title">Заміни, відмови, мовчання по вчителях</h2>
        {rows.length === 0 ? (
          <p className="screen__empty">Немає вчителів у базі.</p>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th>Вчитель</th>
                <th className="stats-table__count">замін</th>
                <th className="stats-table__count">відмов</th>
                <th className="stats-table__count">мовчання</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.teacherId}>
                  <td>{row.name}</td>
                  <td className="stats-table__count">{row.substitutions}</td>
                  <td className="stats-table__count">{row.refused}</td>
                  <td className="stats-table__count">{row.silent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="profile-section">
        <h2 className="profile-section__title">Тупики за {monthLabel(month)}</h2>
        {deadEnds.length === 0 ? (
          <p className="screen__empty">Тупиків цього місяця немає.</p>
        ) : (
          <div className="stats-deadends">
            {deadEnds.map((row) => {
              const bell = slotBell(state.bells, row.class, row.lesson);
              return (
                <div key={row.id} className="stats-deadends__item">
                  {weekdayName(dateToWeekday(row.date))}, {row.date} · {row.class} клас · урок {row.lesson}
                  {bell ? ` (${bell.start}–${bell.end})` : ""} · відсутній: {row.absentTeacherName}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
