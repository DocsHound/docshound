const SECONDS_MS = 1000;
const MIN_SECONDS = 60;
const HOUR_SECONDS = 60 * MIN_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const WEEK_SECONDS = 7 * DAY_SECONDS;
const YEAR_SECONDS = 365.25 * DAY_SECONDS;
const DAY_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const timeOfDay = (date: Date) => {
  const localHour = date.getHours();
  if (localHour >= 5 && localHour < 11) return 'morning' as const;
  if (localHour >= 11 && localHour < 17) return 'afternoon' as const;
  if (localHour >= 17 && localHour < 20) return 'evening' as const;
  return 'night' as const;
};

const dayOfWeek = (date: Date) => {
  return DAY_OF_WEEK[date.getDay()];
};

const mmmdd = (date: Date): string => {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
};

const mmmddyyyy = (date: Date): string => {
  return `${mmmdd(date)} ${date.getUTCFullYear()}`;
};

const hhmm = (date: Date, meridian: boolean): string => {
  const minStr = `${date.getMinutes()}`.padStart(2, '0');
  const rawHours = date.getHours();
  const hours = meridian ? rawHours % 12 || 12 : rawHours;

  return `${hours}:${minStr}${meridian ? (rawHours < 12 ? ' am' : ' pm') : ''}`;
};

// Tues Jan 26, 11:20 PM
export const humanReadableDatetime = (
  date: Date,
  meridian: boolean,
  includeYear?: boolean
) => {
  return `${dayOfWeek(date)} ${(!!includeYear ? mmmddyyyy : mmmdd)(
    date
  )}, ${hhmm(date, meridian)}`;
};

export const secondsAgo = (date: Date): number => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  return seconds;
};

// HH:MM a/pm if today.
// Sat HH:MM am if within the past week (<= 6 days).
// Nov 13 HH:MM am if within past year (<= 364 days).
// Nov 13, 2019 HH:MM am if beyond past year.
export const conditionalDatetime = (date: Date, meridian: boolean): string => {
  let seconds = secondsAgo(date);

  const timeStr = hhmm(date, meridian);

  if (seconds < 86400 && date.getDay() == new Date().getDay()) {
    return timeStr;
  }

  if (seconds <= 86400 * 6) {
    return `${DAY_OF_WEEK[date.getDay()]} ${timeStr}`;
  }

  return humanReadableDatetime(date, meridian, seconds > 86400 * 364);
};

export const humanReadableDuration = (date1: Date, date2: Date) => {
  const diffSeconds = Math.max(
    1,
    (date2.getTime() - date1.getTime()) / SECONDS_MS
  );
  if (diffSeconds < 60) {
    return `${Math.round(diffSeconds)}sec`;
  }
  const diffMinutes = diffSeconds / MIN_SECONDS;
  if (diffMinutes < 60) {
    return `${Math.round(diffMinutes)}min`;
  }
  const diffHours = diffSeconds / HOUR_SECONDS;
  if (diffMinutes < 24) {
    return `${Math.round(diffHours)}hr`;
  }
  const diffDays = diffSeconds / DAY_SECONDS;
  if (diffDays < 7) {
    return `${Math.round(diffDays)}day`;
  }
  const diffWeeks = diffSeconds / WEEK_SECONDS;
  if (diffWeeks < 52) {
    return `${Math.round(diffWeeks)}wk`;
  }
  const diffYears = diffSeconds / YEAR_SECONDS;
  return `${Math.round(diffYears)}yr`;
};
