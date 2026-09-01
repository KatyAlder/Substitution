// weekday: 1 = понеділок (наскрізь по всьому застосунку)

export interface TimeBlock {
  weekday: number;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

/** Пара "предмет → класи, у яких учитель його викладає". Мітки класів —
 *  ті самі рядки, що й у розкладі (звичайні "9-А" та спарені "5-6"/"5/6"). */
export interface TeachingAssignment {
  subject: string;
  classes: string[];
}

export interface Teacher {
  id: string;
  name: string;
  phone?: string;
  curatorOf?: string;
  /** Погодинник: не має типового обов'язку бути в школі поза уроками.
   *  Це лише позначка для профілю — на ранжування не впливає.
   *  Якщо погодинник фактично доступний до/після уроків, це вказується
   *  звичайними блоками в `presence`. */
  isHourly?: boolean;
  subjects: string[];
  /** Явний перелік "у яких класах викладає" — легке джерело істини для
   *  визначення тиру, що НЕ потребує повного тижневого розкладу. Якщо
   *  заповнено — об'єднується (union) з класами, вивіденими зі `schedule`. */
  teaches?: TeachingAssignment[];
  presence: TimeBlock[];
  /** Для кураторів — присутні весь час, `presence` тоді не потрібен. */
  alwaysPresent?: boolean;
  goldenHours: TimeBlock[];
}
