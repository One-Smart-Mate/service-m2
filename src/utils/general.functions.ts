import { stringConstants } from './string.constant';

const capitalizeAndJoinWords = (value: string[]): string => {
  return value
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('. ');
};
export { capitalizeAndJoinWords };

export const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const generateRandomCode = (length: number) => {
  let result = '';
  const charactersLength = stringConstants.characters.length;
  let counter = 0;
  while (counter < length) {
    result += stringConstants.characters.charAt(
      Math.floor(Math.random() * charactersLength),
    );
    counter += 1;
  }
  return result;
};

export const addDaysToDateString = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const generateRandomHex = (length: number): string => {
  const hexChars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  return result;
};

export const convertToISOFormat = (dateString: string): string => {
  // Verified if the date has an incorrect format (p.m./a.m.)
  const hasIncorrectFormat = dateString.includes('p.m.') || dateString.includes('a.m.');
  
  // If it does not have the incorrect format, return it as is
  if (!hasIncorrectFormat) {
    return dateString;
  }

  // Pattern to extract the parts of the incorrectly formatted date
  const regex = /^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2}):(\d{2})\.(\d{3})\s+(a\.m\.|p\.m\.)Z$/;
  const match = dateString.match(regex);

  if (!match) {
    // If it does not match the expected pattern, return it as is
    return dateString;
  }

  const [, datePart, hours, minutes, seconds, milliseconds, period] = match;
  let hour24 = parseInt(hours, 10);

  // Convert from 12 hours to 24 hours
  if (period === 'p.m.' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'a.m.' && hour24 === 12) {
    hour24 = 0;
  }

  // Format the hour with leading zeros if necessary
  const formattedHour = hour24.toString().padStart(2, '0');

  // Construct the correct ISO date
  return `${datePart}T${formattedHour}:${minutes}:${seconds}.${milliseconds}Z`;
};

