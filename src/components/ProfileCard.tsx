import { shortWeekdayName } from "../ranking/presence";
import type { ClassLoad, MonthlyStats } from "../profile/stats";
import { weeklyGoldenHourLabel, weeklyPresenceLabel } from "../profile/stats";
import type { Teacher } from "../types/teacher";

const WEEKDAYS = [1, 2, 3, 4, 5];

interface Props {
  teacher: Teacher;
  load: ClassLoad[];
  monthStats: MonthlyStats;
  monthLabel: string;
}

export function ProfileCard({ teacher, load, monthStats, monthLabel }: Props) {
  const totalLessons = load.reduce((sum, l) => sum + l.lessonsPerWeek, 0);

  return (
    <div className="profile-card">
      <div className="profile-card__header">
        <div className="profile-card__name">
          {teacher.name}
          {teacher.isHourly && <span className="badge">погодинник</span>}
          {teacher.curatorOf && <span className="badge">куратор {teacher.curatorOf}</span>}
        </div>
        <div className="profile-card__phone">{teacher.phone ?? "номер не вказано"}</div>
      </div>

      <section className="profile-section">
        <h2 className="profile-section__title">Навантаження (уроків/тиждень)</h2>
        {load.length === 0 ? (
          <p className="screen__empty">Немає уроків у базовому розкладі.</p>
        ) : (
          <table className="profile-load">
            <tbody>
              {load.map((l) => (
                <tr key={`${l.class}-${l.subject}`}>
                  <td>{l.class} клас</td>
                  <td>{l.subject}</td>
                  <td className="profile-load__count">{l.lessonsPerWeek}</td>
                </tr>
              ))}
              <tr className="profile-load__total">
                <td colSpan={2}>Разом</td>
                <td className="profile-load__count">{totalLessons}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="profile-section">
        <h2 className="profile-section__title">Викладає</h2>
        {teacher.teaches && teacher.teaches.length > 0 ? (
          <ul className="profile-teaches">
            {teacher.teaches.map((a) => (
              <li key={a.subject}>
                <span className="profile-teaches__subject">{a.subject}</span>: {a.classes.join(", ")}
              </li>
            ))}
          </ul>
        ) : (
          <p className="screen__empty">Не позначено (заповнюється в «Редагувати»).</p>
        )}
      </section>

      <section className="profile-section">
        <h2 className="profile-section__title">Присутність</h2>
        <div className="profile-week">
          {WEEKDAYS.map((weekday) => (
            <div className="profile-week__day" key={weekday}>
              <div className="profile-week__label">{shortWeekdayName(weekday)}</div>
              <div className="profile-week__value">{weeklyPresenceLabel(teacher, weekday)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section__title">Золоті години</h2>
        <div className="profile-week">
          {WEEKDAYS.map((weekday) => (
            <div className="profile-week__day" key={weekday}>
              <div className="profile-week__label">{shortWeekdayName(weekday)}</div>
              <div className="profile-week__value">{weeklyGoldenHourLabel(teacher, weekday)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section__title">Статистика за {monthLabel}</h2>
        <dl className="profile-stats">
          <div>
            <dt>замін</dt>
            <dd>{monthStats.substitutions}</dd>
          </div>
          <div>
            <dt>відмов</dt>
            <dd>{monthStats.refused}</dd>
          </div>
          <div>
            <dt>мовчання</dt>
            <dd>{monthStats.silent}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
