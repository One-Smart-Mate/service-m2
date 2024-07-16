import { stringConstants } from './string.constant';

const capitalizeAndJoinWords = (value: string[]): string => {
  return value
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('. ');
};
export { capitalizeAndJoinWords };

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
