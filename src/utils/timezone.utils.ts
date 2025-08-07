/**
 * Convert a local date to a UTC range for searches
 * @param localDate - Date in format YYYY-MM-DD  
 * @param timezone - Timezone in IANA format (e.g: America/Mexico_City)
 * @returns Object with dayStart and dayEnd in UTC
 * 
 * Example: If you send "2025-07-29" with timezone "America/Mexico_City" (GMT-6)
 * Returns the UTC range that corresponds to that entire day in Mexico.
 * dayStart: 2025-07-29 06:00:00 UTC (00:00 in Mexico City is 06:00 in UTC)
 * dayEnd:   2025-07-30 05:59:59 UTC (23:59 in Mexico City is 05:59 next day in UTC)
 */
export function getUTCRangeFromLocalDate(localDate: string, timezone?: string): { dayStart: Date; dayEnd: Date } {
  if (!localDate) {
    throw new Error('localDate must be a non-empty string');
  }
  localDate = localDate.trim();
  
  // If no timezone is provided, default to UTC.
  // The logic inside the try block will handle invalid timezones.
  if (!timezone) {
    const dayStart = new Date(localDate + 'T00:00:00.000Z');
    const dayEnd = new Date(localDate + 'T23:59:59.999Z');
    return { dayStart, dayEnd };
  }

  try {
    // 1. Create a reference date in UTC. Noon is used to avoid DST transition ambiguities.
    const refDate = new Date(`${localDate}T12:00:00Z`);

    // 2. Get the date/time parts as they would be in the target timezone.
    // 'en-CA' gives a reliable YYYY-MM-DD format.
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(refDate).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {} as Record<Intl.DateTimeFormatPartTypes, string>);
    
    // 3. Construct a new date from the target timezone parts, but crucially, interpret it as a UTC date.
    // This gives us a "local time as UTC" value.
    const targetDateAsUtc = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);

    // 4. The offset is the difference between the true UTC time and the "local time as UTC" value.
    const offsetMs = refDate.getTime() - targetDateAsUtc.getTime();

    // 5. Create the start and end of the day using the local date parts, interpreted as UTC.
    const startOfDayInLocalParts = new Date(`${localDate}T00:00:00.000Z`);
    const endOfDayInLocalParts = new Date(`${localDate}T23:59:59.999Z`);
    
    // 6. The true UTC time is the local-parts-as-UTC timestamp *plus* the calculated offset.
    // If Mexico (UTC-6) is 6 hours *behind* UTC, to convert from local to UTC we need to add 6 hours.
    // The offset calculated gives us how much to add to get from local time to UTC time.
    const dayStart = new Date(startOfDayInLocalParts.getTime() + offsetMs);
    const dayEnd = new Date(endOfDayInLocalParts.getTime() + offsetMs);

    return { dayStart, dayEnd };
  } catch (error) {
    console.warn(`Error processing timezone '${timezone}', falling back to UTC:`, error);
    // Fallback to UTC if the timezone is invalid or another error occurs.
    const dayStart = new Date(localDate + 'T00:00:00.000Z');
    const dayEnd = new Date(localDate + 'T23:59:59.999Z');
    return { dayStart, dayEnd };
  }
}

/**
* Validate if a timezone is in a valid IANA format
 * @param timezone - Timezone to validate
 * @returns boolean
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone) return false;
  
  try {
    // Try to use the timezone with Intl
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone information including the current offset
 * @param timezone - Timezone in IANA format
 * @returns Timezone information
 */
export function getTimezoneInfo(timezone: string): { timezone: string; offset: string; isValid: boolean } {
  if (!isValidTimezone(timezone)) {
    return { timezone, offset: 'UTC+0', isValid: false };
  }
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    const offset = offsetPart ? offsetPart.value : 'UTC+0';
    
    return { timezone, offset, isValid: true };
  } catch {
    return { timezone, offset: 'UTC+0', isValid: false };
  }
} 