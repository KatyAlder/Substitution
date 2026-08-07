// weekday: 1 = понеділок (наскрізь по всьому застосунку)

export interface TimeBlock {
  weekday: number;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
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
  presence: TimeBlock[];
  /** Для кураторів — присутні весь час, `presence` тоді не потрібен. */
  alwaysPresent?: boolean;
  goldenHours: TimeBlock[];
}
