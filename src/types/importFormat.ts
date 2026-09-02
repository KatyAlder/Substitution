import type { Bell } from "./schedule";
import type { TeachingAssignment, TimeBlock } from "./teacher";

export interface ImportTeacher {
  id: string;
  name: string;
  phone?: string;
  curatorOf?: string;
  isHourly?: boolean;
  alwaysPresent?: boolean;
  subjects: string[];
  /** Необов'язкове. Відсутнє в JSON — наявне значення вчителя лишається
   *  (як phone/presence/goldenHours). Присутнє — заміщує. */
  teaches?: TeachingAssignment[];
  presence?: TimeBlock[];
  goldenHours?: TimeBlock[];
}

/** Запис розкладу у файлі імпорту. Час можна задати прямо (`start`/`end`)
 *  або лишити його порожнім — тоді він виводиться з `bells` за парою
 *  (клас → ланка, номер уроку). Саме тут, на межі імпорту, номер уроку
 *  востаннє означає час; усередині застосунку час зберігається явно. */
export interface ImportScheduleEntry {
  teacherId: string;
  weekday: number;
  lesson: number;
  class: string;
  subject: string;
  room: string;
  start?: string; // "HH:MM"
  end?: string; // "HH:MM"
}

export interface ScheduleImport {
  version: number;
  updatedAt: string; // "YYYY-MM-DD"
  bells: Bell[];
  teachers: ImportTeacher[];
  schedule: ImportScheduleEntry[];
  /** `true` — розклад замінюється ПОВНІСТЮ: усе, чого немає в цьому файлі,
   *  зникає. Потрібно, щоб зібрати розклад заново з нуля; за замовчуванням
   *  (відсутнє або `false`) імпорт лише додає й оновлює записи за ключем
   *  (вчитель, день, час початку), а старих не чіпає. Вчителів не стосується
   *  ніколи — їхні профілі зберігаються в обох режимах. */
  replaceSchedule?: boolean;
}
