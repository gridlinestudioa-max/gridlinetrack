// Event dates are stored as plain dates/times local to the track, so we format
// them without any timezone conversion.

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const MON_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parse(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d, dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

export function dateParts(date: string) {
  const { y, m, d, dow } = parse(date);
  return {
    dow: DOW[dow],
    dowLong: DOW_LONG[dow],
    mon: MON[m - 1],
    monLong: MON_LONG[m - 1],
    day: String(d).padStart(2, "0"),
    month: String(m).padStart(2, "0"),
    year: String(y),
  };
}

/** "Saturday, October 12, 2026" */
export function longDate(date: string) {
  const p = dateParts(date);
  return `${p.dowLong}, ${p.monLong} ${Number(p.day)}, ${p.year}`;
}

/** "16:00:00" -> { time: "4:00", period: "PM" } */
export function timeParts(time: string | null) {
  if (!time) return null;
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  return { time: `${h % 12 === 0 ? 12 : h % 12}:${mStr}`, period: h < 12 ? "AM" : "PM" };
}

export function shortTime(time: string | null) {
  const t = timeParts(time);
  return t ? `${t.time} ${t.period}` : null;
}

/** Today's date (YYYY-MM-DD) in the track's timezone. */
export function todayIn(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      new Date(),
    );
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string) {
  const a = parse(from);
  const b = parse(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}
