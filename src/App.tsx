import { useState } from "react";
import { CalendarScreen } from "./screens/CalendarScreen";
import { CandidatesScreen } from "./screens/CandidatesScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { StatisticsScreen } from "./screens/StatisticsScreen";

type Tab = "candidates" | "calendar" | "profiles" | "statistics";

function App() {
  const [tab, setTab] = useState<Tab>("candidates");

  return (
    <>
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
      </nav>

      {tab === "candidates" && <CandidatesScreen />}
      {tab === "calendar" && <CalendarScreen />}
      {tab === "profiles" && <ProfileScreen />}
      {tab === "statistics" && <StatisticsScreen />}
    </>
  );
}

export default App;
