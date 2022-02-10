const SECONDS_MS = 1000;
const MIN_SECONDS = 60;
const HOUR_SECONDS = 60 * MIN_SECONDS;
const DAY_SECONDS = 24 * HOUR_SECONDS;
const WEEK_SECONDS = 7 * DAY_SECONDS;
const YEAR_SECONDS = 365.25 * DAY_SECONDS;

interface Timedelta {
  seconds?: number;
  hours?: number;
  days?: number;
}

export const addTimedelta = (
  date: Date,
  { seconds, hours, days }: Timedelta
) => {
  let ret = date.getTime();
  if (seconds) ret += seconds * SECONDS_MS;
  if (hours) ret += hours * HOUR_SECONDS * SECONDS_MS;
  if (days) ret += days * DAY_SECONDS * SECONDS_MS;
  return new Date(ret);
};

export const timedeltaMS = ({ seconds, hours, days }: Timedelta) => {
  let ret = 0;
  if (seconds) ret += seconds * SECONDS_MS;
  if (hours) ret += hours * HOUR_SECONDS * SECONDS_MS;
  if (days) ret += days * DAY_SECONDS * SECONDS_MS;
  return ret;
};
