import { BadRequestException } from '@nestjs/common';

export const DEFAULT_SITE_TIMEZONE = 'America/Mexico_City';

export function assertSiteTimezone(timezone: string): string {
  if (typeof timezone !== 'string' || !timezone || timezone.length > 64) {
    throw new BadRequestException('Invalid site timezone');
  }
  try {
    return new Intl.DateTimeFormat('en', {
      timeZone: timezone,
    }).resolvedOptions().timeZone;
  } catch {
    throw new BadRequestException('Site timezone must be an IANA timezone');
  }
}

/** A calendar date, represented in UTC only for date arithmetic. */
export function parseCiltLocalDate(value: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Date must be in format YYYY-MM-DD');
  }
  const result = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(result.getTime()) ||
    result.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException('Invalid calendar date');
  }
  return result;
}

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

function wallTimestamp(date: Date, timezone: string): number {
  const parts = localParts(date, timezone);
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000Z`,
  ).getTime();
}

export function ciltLocalDateAt(instant: Date, timezone: string): string {
  const parts = localParts(instant, assertSiteTimezone(timezone));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Repeated DST times use the first occurrence; missing times advance by the DST gap. */
export function ciltScheduledInstant(
  date: string,
  time: string,
  timezone: string,
): Date {
  parseCiltLocalDate(date);
  assertSiteTimezone(timezone);
  if (!/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) {
    throw new BadRequestException('Schedule must be in format HH:mm:ss');
  }
  const target = new Date(`${date}T${time}.000Z`).getTime();
  const offsets = new Set<number>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const sample = target + hours * 3600000;
    offsets.add(wallTimestamp(new Date(sample), timezone) - sample);
  }
  const candidates = [...offsets].map((offset) => {
    const instant = new Date(target - offset);
    return { instant, wall: wallTimestamp(instant, timezone) };
  });
  const exact = candidates
    .filter((candidate) => candidate.wall === target)
    .sort((a, b) => a.instant.getTime() - b.instant.getTime());
  if (exact.length) return exact[0].instant;
  const advanced = candidates
    .filter((candidate) => candidate.wall > target)
    .sort((a, b) => a.wall - b.wall);
  if (advanced.length) return advanced[0].instant;
  throw new BadRequestException('Schedule cannot be resolved in site timezone');
}

export function ciltSiteDayRange(date: string, timezone: string) {
  const nextDay = parseCiltLocalDate(date);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const dayStart = ciltScheduledInstant(date, '00:00:00', timezone);
  const nextStart = ciltScheduledInstant(
    nextDay.toISOString().slice(0, 10),
    '00:00:00',
    timezone,
  );
  return { dayStart, dayEnd: new Date(nextStart.getTime() - 1) };
}
