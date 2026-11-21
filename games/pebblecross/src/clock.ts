import { DAY_NAMES, DAY_SECONDS, MINUTES_PER_DAY, START_HOUR } from './config';

export function gameMinutesPerRealSecond(): number {
  return MINUTES_PER_DAY / DAY_SECONDS;
}

export function dayIndex(total: number): number {
  return Math.floor(total / MINUTES_PER_DAY);
}

export function hourOf(total: number): number {
  return ((((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY) / 60);
}

export function dayName(total: number): string {
  const i = dayIndex(total);
  return DAY_NAMES[((i % 7) + 7) % 7];
}

export function isWeekend(total: number): boolean {
  const name = dayName(total);
  return name === 'Sat' || name === 'Sun';
}

export function clockLabel(total: number): string {
  const minuteOfDay = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hh = Math.floor(minuteOfDay / 60);
  const mm = Math.floor(minuteOfDay % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dayName(total)} ${pad(hh)}:${pad(mm)}`;
}

export function startClock(): number {
  return START_HOUR * 60;
}
