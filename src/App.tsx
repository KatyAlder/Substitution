import { useState } from "react";
import { CalendarScreen } from "./screens/CalendarScreen";
import { CandidatesScreen } from "./screens/CandidatesScreen";
import { ImportScreen } from "./screens/ImportScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { ScheduleScreen } from "./screens/ScheduleScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";
import { SyncBar } from "./sync/SyncBar";

type Tab = "candidates" | "calendar" | "profiles" | "statistics" | "schedule" | "import";

function App() {
  const [tab, setTab] = useState<Tab>("candidates");

  return (
    <>
      <SyncBar />
      <nav className="tab-nav">
        <button
          type="button"
          className={`tab-nav__item${tab === "candidates" ? " tab-nav__item--active" : ""}`}
          onClick={() => setTab("candidates")}
        >
          Активні заміни
        </button>
        <button
          type="button"
          className={`tab-nav__item${tab === "calendar" ? " tab-nav__item--active" : ""}`}
          onClick={() => setTab("calendar")}
        >
          Календар
        </button>
        <button
          type="button"
          className={`tab-nav__item${tab === "profiles" ? " tab-nav__item--active" : ""}`}
          onClick={() => setTab("profiles")}
        >
          Профілі
        </button>
        <button
          type="button"
          className={`tab-nav__item${tab === "statistics" ? " tab-nav__item--active" : ""}`}
          onClick={() => setTab("statistics")}
        >
          Статистика
        </button>
        <button
          type="button"
          className={`tab-nav__item${tab === "schedule" ? " tab-nav__item--active" : ""}`}
          onClick={() => setTab("schedule")}
        >
          Розклад
        </button>
        <button
          type="button"
          className={`tab-nav__item${tab === "import" ? " tab-nav__item--active" : ""}`}
          onClick={() => setTab("import")}
        >
          Імпорт
        </button>
      </nav>

      {tab === "candidates" && <CandidatesScreen />}
      {tab === "calendar" && <CalendarScreen />}
      {tab === "profiles" && <ProfileScreen />}
      {tab === "statistics" && <StatisticsScreen />}
      {tab === "schedule" && <ScheduleScreen />}
      {tab === "import" && <ImportScreen />}
    </>
  );
}

export default App;
