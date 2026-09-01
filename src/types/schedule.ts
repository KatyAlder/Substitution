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
  lesson: number;
  class: string;
  subject: string;
  room: string;
}
