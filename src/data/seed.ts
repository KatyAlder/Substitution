import type { AppState } from "../types/state";

// Вигаданий набір для перевірки ранжування (розділ 10 ТЗ).
// Дати — вівторок/середа/четвер, 8–10 вересня 2026.
// Кожен вчитель нижче навмисно закриває один із крайових випадків,
// перелічених при плануванні сесії — коментарі показують, який саме.

export const seedState: AppState = {
  version: 1,
  updatedAt: "2026-09-05",

  bells: [
    { lesson: 1, start: "09:00", end: "09:45" },
    { lesson: 2, start: "09:55", end: "10:40" },
    { lesson: 3, start: "10:50", end: "11:35" },
    { lesson: 4, start: "11:55", end: "12:40" },
    { lesson: 5, start: "12:50", end: "13:35" },
  ],

  teachers: [
    // відсутній у слоті 1 (вт, урок 3, 11 клас, інформатика)
    {
      id: "tkachenko-ihor",
      name: "Ткаченко Ігор",
      subjects: ["інформатика"],
      presence: [{ weekday: 2, from: "08:30", to: "14:00" }],
      goldenHours: [],
    },

    // відсутня у слоті 2 (ср, урок 2, 7-А, біологія) — приклад з розділу 8
    {
      id: "klymenko-oksana",
      name: "Клименко Оксана",
      curatorOf: "7-А",
      alwaysPresent: true,
      subjects: ["біологія"],
      presence: [],
      goldenHours: [{ weekday: 3, from: "12:00", to: "15:00" }],
    },

    // кураторка "11", і сама викладає інформатику цьому класу → тир 2 (слот 1)
    {
      id: "honcharuk-iryna",
      name: "Гончарук Ірина",
      curatorOf: "11",
      alwaysPresent: true,
      subjects: ["інформатика"],
      presence: [],
      goldenHours: [],
    },

    // звичайна, присутня, викладає клас → тир 1 (слот 1). Разом із Кравець —
    // навмисна нічия за кількістю уроків у вівторок (по 3)
    {
      id: "melnyk-taras",
      name: "Мельник Тарас",
      subjects: ["інформатика"],
      presence: [
        { weekday: 2, from: "08:30", to: "14:00" },
        { weekday: 3, from: "08:30", to: "12:00" },
      ],
      goldenHours: [],
    },

    // те саме, що Мельник — нічия за уроками у слоті 1;
    // у слоті 2 немає присутності в середу → тир 3 (звичайний, не погодинник)
    {
      id: "kravets-maryna",
      name: "Кравець Марина",
      subjects: ["інформатика"],
      presence: [{ weekday: 2, from: "08:00", to: "14:30" }],
      goldenHours: [],
    },

    // погодинниця: не зобов'язана бути в школі, але сама вказала блок
    // присутності, що виходить за межі власного уроку і покриває слот 1 →
    // тир 1, а не тир 3 — саме так має враховуватись погодинник "на місці"
    {
      id: "bondarenko-svitlana",
      name: "Бондаренко Світлана",
      isHourly: true,
      subjects: ["інформатика"],
      presence: [{ weekday: 2, from: "10:40", to: "12:00" }],
      goldenHours: [],
    },

    // погодинник: присутній лише під час власного уроку, слот 1 не покриває
    // → тир 3, чистий приклад без збігу з тиром 1
    {
      id: "zakharchenko-viktor",
      name: "Захарченко Віктор",
      isHourly: true,
      subjects: ["інформатика"],
      presence: [{ weekday: 2, from: "09:00", to: "09:45" }],
      goldenHours: [],
    },

    // присутній, не куратор, не викладає "11" → тир 4
    {
      id: "koval-andrii",
      name: "Коваль Андрій",
      subjects: ["математика"],
      presence: [
        { weekday: 2, from: "08:00", to: "16:00" },
        { weekday: 3, from: "08:00", to: "16:00" },
      ],
      goldenHours: [],
    },

    // кураторка іншого класу, не викладає "11"/"7-А" → тир 5
    {
      id: "shevchenko-natalia",
      name: "Шевченко Наталія",
      curatorOf: "8-Б",
      alwaysPresent: true,
      subjects: ["українська мова"],
      presence: [],
      goldenHours: [],
    },

    // не присутній жодного з цих днів, не куратор, не викладає → тир 6
    {
      id: "lytvyn-oleh",
      name: "Литвин Олег",
      subjects: ["фізика"],
      presence: [{ weekday: 4, from: "08:00", to: "15:00" }],
      goldenHours: [],
    },

    // тир 1 + бонус золотої години (покриває слот 1)
    {
      id: "savchuk-dmytro",
      name: "Савчук Дмитро",
      subjects: ["англійська мова"],
      presence: [{ weekday: 2, from: "09:00", to: "13:00" }],
      goldenHours: [{ weekday: 2, from: "10:30", to: "12:00" }],
    },

    // тир 1 + 3 відмови поспіль (бонус), золотої години немає
    {
      id: "romaniuk-yulia",
      name: "Романюк Юлія",
      subjects: ["фізична культура"],
      presence: [{ weekday: 2, from: "08:00", to: "14:00" }],
      goldenHours: [],
    },

    // сам має урок у слоті 1 (хімія в каб-14 тієї ж миті) → виключений як
    // кандидат самоконфліктом; лишається джерелом зайнятої лабораторії
    {
      id: "diachenko-petro",
      name: "Дяченко Петро",
      subjects: ["хімія"],
      presence: [],
      goldenHours: [],
    },
  ],

  schedule: [
    // Ткаченко Ігор
    { teacherId: "tkachenko-ihor", weekday: 2, lesson: 1, class: "11", subject: "інформатика", room: "каб-14" },
    { teacherId: "tkachenko-ihor", weekday: 2, lesson: 3, class: "11", subject: "інформатика", room: "каб-14" },
    { teacherId: "tkachenko-ihor", weekday: 4, lesson: 1, class: "9-Б", subject: "інформатика", room: "каб-14" },

    // Клименко Оксана
    { teacherId: "klymenko-oksana", weekday: 2, lesson: 4, class: "7-А", subject: "біологія", room: "каб-12" },
    { teacherId: "klymenko-oksana", weekday: 3, lesson: 2, class: "7-А", subject: "біологія", room: "каб-12" },
    { teacherId: "klymenko-oksana", weekday: 4, lesson: 1, class: "7-А", subject: "біологія", room: "каб-12" },

    // Гончарук Ірина
    { teacherId: "honcharuk-iryna", weekday: 3, lesson: 1, class: "11", subject: "інформатика", room: "каб-14" },

    // Мельник Тарас — 3 уроки у вівторок (нічия з Кравець)
    { teacherId: "melnyk-taras", weekday: 2, lesson: 1, class: "11", subject: "інформатика", room: "каб-14" },
    { teacherId: "melnyk-taras", weekday: 2, lesson: 2, class: "9-Б", subject: "інформатика", room: "каб-9" },
    { teacherId: "melnyk-taras", weekday: 2, lesson: 4, class: "10-Б", subject: "інформатика", room: "каб-9" },
    { teacherId: "melnyk-taras", weekday: 3, lesson: 1, class: "7-А", subject: "інформатика", room: "каб-9" },

    // Кравець Марина — 3 уроки у вівторок (нічия з Мельником)
    { teacherId: "kravets-maryna", weekday: 2, lesson: 1, class: "9-А", subject: "інформатика", room: "каб-9" },
    { teacherId: "kravets-maryna", weekday: 2, lesson: 2, class: "8-Б", subject: "інформатика", room: "каб-9" },
    { teacherId: "kravets-maryna", weekday: 2, lesson: 5, class: "11", subject: "інформатика", room: "каб-14" },
    { teacherId: "kravets-maryna", weekday: 3, lesson: 4, class: "7-А", subject: "інформатика", room: "каб-9" },

    // Бондаренко Світлана — власний урок + викладає "11" на іншому тижневому дні
    { teacherId: "bondarenko-svitlana", weekday: 2, lesson: 2, class: "9-А", subject: "інформатика", room: "каб-9" },
    { teacherId: "bondarenko-svitlana", weekday: 4, lesson: 3, class: "11", subject: "інформатика", room: "каб-14" },

    // Захарченко Віктор — власний урок + викладає "11" на іншому дні
    { teacherId: "zakharchenko-viktor", weekday: 2, lesson: 1, class: "8-Б", subject: "інформатика", room: "каб-9" },
    { teacherId: "zakharchenko-viktor", weekday: 4, lesson: 2, class: "11", subject: "інформатика", room: "каб-9" },

    // Коваль Андрій — математика, не перетинається з "11" чи "7-А"
    { teacherId: "koval-andrii", weekday: 2, lesson: 1, class: "9-А", subject: "математика", room: "каб-5" },
    { teacherId: "koval-andrii", weekday: 2, lesson: 2, class: "8-Б", subject: "математика", room: "каб-5" },
    { teacherId: "koval-andrii", weekday: 2, lesson: 4, class: "10-Б", subject: "математика", room: "каб-5" },
    { teacherId: "koval-andrii", weekday: 2, lesson: 5, class: "9-Б", subject: "математика", room: "каб-5" },
    { teacherId: "koval-andrii", weekday: 3, lesson: 1, class: "9-А", subject: "математика", room: "каб-5" },
    { teacherId: "koval-andrii", weekday: 3, lesson: 3, class: "10-Б", subject: "математика", room: "каб-5" },

    // Шевченко Наталія — українська, тільки "8-Б", уникає lesson3 вт і lesson2 ср
    { teacherId: "shevchenko-natalia", weekday: 2, lesson: 1, class: "8-Б", subject: "українська мова", room: "каб-6" },
    { teacherId: "shevchenko-natalia", weekday: 2, lesson: 2, class: "8-Б", subject: "українська мова", room: "каб-6" },
    { teacherId: "shevchenko-natalia", weekday: 2, lesson: 4, class: "8-Б", subject: "українська мова", room: "каб-6" },
    { teacherId: "shevchenko-natalia", weekday: 3, lesson: 1, class: "8-Б", subject: "українська мова", room: "каб-6" },
    { teacherId: "shevchenko-natalia", weekday: 3, lesson: 3, class: "8-Б", subject: "українська мова", room: "каб-6" },

    // Литвин Олег — фізика, тільки четвер
    { teacherId: "lytvyn-oleh", weekday: 4, lesson: 2, class: "10-Б", subject: "фізика", room: "каб-7" },

    // Савчук Дмитро — англійська, викладає й "11"
    { teacherId: "savchuk-dmytro", weekday: 2, lesson: 1, class: "11", subject: "англійська мова", room: "каб-8" },
    { teacherId: "savchuk-dmytro", weekday: 2, lesson: 4, class: "9-А", subject: "англійська мова", room: "каб-8" },

    // Романюк Юлія — фізкультура, 4 уроки у вівторок + викладає "11" у четвер
    { teacherId: "romaniuk-yulia", weekday: 2, lesson: 1, class: "8-Б", subject: "фізична культура", room: "спортзал" },
    { teacherId: "romaniuk-yulia", weekday: 2, lesson: 2, class: "9-А", subject: "фізична культура", room: "спортзал" },
    { teacherId: "romaniuk-yulia", weekday: 2, lesson: 4, class: "10-Б", subject: "фізична культура", room: "спортзал" },
    { teacherId: "romaniuk-yulia", weekday: 2, lesson: 5, class: "9-Б", subject: "фізична культура", room: "спортзал" },
    { teacherId: "romaniuk-yulia", weekday: 4, lesson: 3, class: "11", subject: "фізична культура", room: "спортзал" },

    // Дяченко Петро — хімія, той самий вівторок/урок3/кабінет, що й слот 1
    { teacherId: "diachenko-petro", weekday: 2, lesson: 3, class: "10-Б", subject: "хімія", room: "каб-14" },
  ],

  substitutions: [
    // активна черга — саме її показує екран кандидатів
    {
      id: "sub-1",
      date: "2026-09-08",
      lesson: 3,
      class: "11",
      absentTeacherId: "tkachenko-ihor",
      mode: "urgent",
      status: "open",
      officialCalendarUpdated: false,
    },
    {
      id: "sub-2",
      date: "2026-09-09",
      lesson: 2,
      class: "7-А",
      absentTeacherId: "klymenko-oksana",
      mode: "planned",
      status: "open",
      officialCalendarUpdated: false,
    },

    // закриті цього ж місяця — для лічильника "замін за місяць" на картках
    {
      id: "sub-h1",
      date: "2026-09-02",
      lesson: 2,
      class: "9-Б",
      absentTeacherId: "klymenko-oksana",
      mode: "urgent",
      status: "closed",
      substituteId: "melnyk-taras",
      closedVia: "call",
      officialCalendarUpdated: true,
    },
    {
      id: "sub-h2",
      date: "2026-09-03",
      lesson: 1,
      class: "9-А",
      absentTeacherId: "koval-andrii",
      mode: "urgent",
      status: "closed",
      substituteId: "savchuk-dmytro",
      closedVia: "voluntary",
      officialCalendarUpdated: true,
    },
    {
      id: "sub-h3",
      date: "2026-09-01",
      lesson: 4,
      class: "10-Б",
      absentTeacherId: "koval-andrii",
      mode: "planned",
      status: "closed",
      substituteId: "kravets-maryna",
      closedVia: "chat",
      officialCalendarUpdated: true,
    },
    {
      id: "sub-h4",
      date: "2026-09-04",
      lesson: 5,
      class: "9-Б",
      absentTeacherId: "koval-andrii",
      mode: "urgent",
      status: "closed",
      substituteId: "kravets-maryna",
      closedVia: "manual",
      officialCalendarUpdated: true,
    },
    {
      id: "sub-h5",
      date: "2026-09-05",
      lesson: 1,
      class: "8-Б",
      absentTeacherId: "shevchenko-natalia",
      mode: "urgent",
      status: "closed",
      substituteId: "kravets-maryna",
      closedVia: "call",
      officialCalendarUpdated: true,
    },
    {
      id: "sub-h6",
      date: "2026-09-06",
      lesson: 2,
      class: "9-А",
      absentTeacherId: "zakharchenko-viktor",
      mode: "urgent",
      status: "closed",
      substituteId: "kravets-maryna",
      closedVia: "call",
      officialCalendarUpdated: true,
    },
  ],

  // 3 відмови поспіль у Романюк Юлії. Мовчання (att-2) навмисно не має
  // рахуватись і не переривати серію заднім числом — воно просто
  // пропускається (розділ 3: "мовчання — не відмова").
  attempts: [
    { id: "att-1", substitutionId: "hist-1", teacherId: "romaniuk-yulia", at: "2026-08-20T10:00:00", result: "agreed" },
    { id: "att-2", substitutionId: "hist-2", teacherId: "romaniuk-yulia", at: "2026-08-27T10:00:00", result: "silent" },
    { id: "att-3", substitutionId: "hist-3", teacherId: "romaniuk-yulia", at: "2026-09-01T10:00:00", result: "refused" },
    { id: "att-4", substitutionId: "hist-4", teacherId: "romaniuk-yulia", at: "2026-09-03T10:00:00", result: "refused" },
    { id: "att-5", substitutionId: "hist-5", teacherId: "romaniuk-yulia", at: "2026-09-05T10:00:00", result: "refused" },
  ],
};
