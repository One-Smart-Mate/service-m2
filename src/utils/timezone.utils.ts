/**
 * Convert a local date to a UTC range for searches
 * @param localDate - Date in format YYYY-MM-DD  
 * @param timezone - Timezone in IANA format (e.g: America/Mexico_City)
 * @returns Object with dayStart and dayEnd in UTC
 * 
 * Example: If you send "2025-01-21" with timezone "America/Mexico_City" (GMT-6)
 * Returns the UTC range that corresponds to that entire day in Mexico
 * dayStart: 2025-01-20 18:00:00 UTC (día 21 menos 6 horas = día 20 a las 18:00)
 * dayEnd: 2025-01-22 00:00:00 UTC (día 21 + 24 horas - 6 horas = día 22 a las 00:00)
 */
export function getUTCRangeFromLocalDate(localDate: string, timezone?: string): { dayStart: Date; dayEnd: Date } {
  if (!timezone) {
    // If there is no timezone, use UTC
    const dayStart = new Date(localDate + 'T00:00:00.000Z');
    const dayEnd = new Date(localDate + 'T23:59:59.999Z');
    return { dayStart, dayEnd };
  }

  try {
    // Get the timezone offset in hours
    const offsetHours = getTimezoneOffsetHours(timezone);
    
    // Parse the local date
    const [year, month, day] = localDate.split('-').map(Number);
    
    // Create the start of day in local date, then subtract the timezone offset
    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const dayStart = new Date(startDate.getTime() - (offsetHours * 3600000));
    
    // Create the end of day (start of next day) - Without offset
    const endDate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
    const dayEnd = endDate; // Without offset
    
    // Debug logging
    console.log(`Converting ${localDate} in ${timezone}:`);
    console.log(`Offset: ${offsetHours} hours`);
    console.log(`Local start: ${localDate}T00:00:00.000 -> UTC: ${dayStart.toISOString()}`);
    console.log(`Local end: ${localDate}T24:00:00.000 -> UTC: ${dayEnd.toISOString()}`);
    
    return { dayStart, dayEnd };
  } catch (error) {
    console.warn(`Error processing timezone ${timezone}, falling back to UTC:`, error);
    // Fallback to UTC if there is an error
    const dayStart = new Date(localDate + 'T00:00:00.000Z');
    const dayEnd = new Date(localDate + 'T23:59:59.999Z');
    return { dayStart, dayEnd };
  }
}

/**
 * Get timezone offset in hours for a specific timezone
 * @param timezone - Timezone IANA (e.g., "America/Mexico_City")
 * @returns Offset in hours to subtract from UTC (positive for timezones behind UTC like GMT-6)
 */
function getTimezoneOffsetHours(timezone: string): number {
  const now = new Date();
  
  // Create a test date to determine offset
  const testDate = new Date('2025-01-21T12:00:00.000Z'); // Use a fixed date for consistency
  
  // Get the same moment in the target timezone
  const utcFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const targetFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const utcTime = utcFormatter.format(testDate);
  const targetTime = targetFormatter.format(testDate);
  
  // Parse both times
  const utcDate = new Date(utcTime);
  const targetDate = new Date(targetTime);
  
  // Calculate offset in hours
  // If target time is behind UTC (like Mexico GMT-6), the offset should be positive
  const offsetMs = utcDate.getTime() - targetDate.getTime();
  const offsetHours = offsetMs / (1000 * 60 * 60);
  
  console.log(`Timezone ${timezone} offset: ${offsetHours} hours (to subtract from UTC)`);
  
  return offsetHours;
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