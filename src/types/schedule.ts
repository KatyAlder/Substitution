export interface Bell {
  lesson: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  /** id ланки школи (`SCHOOL_LEVELS` у config/settings). Номер уроку
   *  унікальний лише в межах ланки, тож без цього поля 2-й урок початкової
   *  і 2-й урок старшої нерозрізненні. Відсутнє — дзвінок чинний для всіх
   *  ланок (так поводяться бази, збережені до появи ланок). */
  level?: string;
}

export interface ScheduleEntry {
  teacherId: string;
  weekday: number;
  /** Реальний час уроку — ЄДИНЕ джерело істини про те, коли він відбувається.
   *  Номер уроку для цього непридатний: у кожної ланки школи свій розклад
   *  дзвінків, тож однакові номери означають різний час, а різні — можуть
   *  перетинатися. */
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  /** Номер уроку — лише підпис для людини ("урок 3"). На логіку не впливає. */
  lesson: number;
  class: string;
  subject: string;
  room: string;
}
