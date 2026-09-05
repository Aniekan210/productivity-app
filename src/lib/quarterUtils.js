import {
  format,
  parseISO,
  differenceInCalendarDays,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addDays,
  isBefore,
  isAfter,
} from "date-fns";

export const dayKey = (d) => format(d, "yyyy-MM-dd");

// Today as yyyy-MM-dd. If a timezone (IANA) is supplied, compute it in that
// zone so "today" follows the user's chosen timezone rather than the device.
export const todayKey = (tz) => {
  if (tz) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch {
      return format(new Date(), "yyyy-MM-dd");
    }
  }
  return format(new Date(), "yyyy-MM-dd");
};

export const fmtDate = (d, pattern = "MMM d, yyyy") => format(d, pattern);

// Calendar quarter for a given date (Q1=Jan-Mar ...).
export function calendarQuarterFor(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const q = Math.floor(month / 3) + 1;
  const start = new Date(year, (q - 1) * 3, 1);
  const end = new Date(year, (q - 1) * 3 + 3, 0);
  return { q, year, start, end, name: `Q${q} ${year}` };
}

export function nextCalendarQuarterAfter(date) {
  const cur = calendarQuarterFor(date);
  const nextStart = addDays(cur.end, 1);
  return calendarQuarterFor(nextStart);
}

export function quarterDays(start, end) {
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
}

export function quarterDayCount(start, end) {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
}

// Progress through the quarter. `todayStr` (yyyy-MM-dd) lets callers pass the
// timezone-correct "today"; falls back to the device clock.
export function quarterProgress(start, end, todayStr) {
  const s = parseISO(start);
  const e = parseISO(end);
  const t = todayStr ? parseISO(todayStr) : new Date();
  const total = differenceInCalendarDays(e, s) + 1;
  let elapsed = differenceInCalendarDays(t, s) + 1;
  if (elapsed < 0) elapsed = 0;
  if (elapsed > total) elapsed = total;
  return { elapsed, total, dayNumber: elapsed, now: t };
}

// Intensity 0-4 for a day; -1 means no activities planned.
export function dayIntensity(planned, completed) {
  if (planned === 0) return -1;
  const ratio = completed / planned;
  if (ratio <= 0) return 0;
  if (ratio < 0.34) return 1;
  if (ratio < 0.67) return 2;
  if (ratio < 1) return 3;
  return 4;
}

// Map of dateKey -> { planned, completed, activities }
export function buildDayMap(activities) {
  const map = {};
  for (const a of activities || []) {
    const k = a.date;
    if (!map[k]) map[k] = { planned: 0, completed: 0, activities: [] };
    map[k].planned++;
    if (a.completed) map[k].completed++;
    map[k].activities.push(a);
  }
  return map;
}

// GitHub-style grid: weeks as columns, weekdays (Mon-Sun) as rows.
export function buildTimelineGrid(start, end) {
  const days = quarterDays(start, end);
  const gridStart = startOfWeek(days[0], { weekStartsOn: 1 });
  const gridEnd = endOfWeek(days[days.length - 1], { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7)
    weeks.push(allDays.slice(i, i + 7));
  const inQuarter = new Set(days.map(dayKey));
  return { weeks, inQuarter };
}

// Activity completion over all days up to (and including) upToDateKey.
export function activityCompletion(dayMap, upToDateKey) {
  let planned = 0,
    completed = 0;
  for (const k in dayMap) {
    if (k > upToDateKey) continue;
    planned += dayMap[k].planned;
    completed += dayMap[k].completed;
  }
  return { planned, completed, rate: planned ? completed / planned : 0 };
}

export function dayClassifications(dayMap, upToDateKey) {
  let perfect = 0,
    partial = 0,
    missed = 0,
    unplanned = 0;
  for (const k in dayMap) {
    if (k > upToDateKey) continue;
    const d = dayMap[k];
    if (d.planned === 0) {
      unplanned++;
      continue;
    }
    if (d.completed === d.planned) perfect++;
    else if (d.completed > 0) partial++;
    else missed++;
  }
  return { perfect, partial, missed, unplanned };
}

// Generate the dates a recurring activity lands on within [start, end].
export function recurrenceDates(
  startDate,
  endDate,
  weekdays,
  rangeStart,
  rangeEnd,
) {
  const out = [];
  let cur = parseISO(startDate);
  const stop = parseISO(endDate);
  const rStart = rangeStart ? parseISO(rangeStart) : cur;
  const rEnd = rangeEnd ? parseISO(rangeEnd) : stop;
  while (!isAfter(cur, stop)) {
    const dow = cur.getDay();
    if (
      weekdays.includes(dow) &&
      !isBefore(cur, rStart) &&
      !isAfter(cur, rEnd)
    ) {
      out.push(dayKey(cur));
    }
    cur = addDays(cur, 1);
  }
  return out;
}

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export function pct(n) {
  return Math.round(n * 100);
}
