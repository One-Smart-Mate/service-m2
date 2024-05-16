const capitalizeAndJoinWords = (value: string[]): string => {
  return value
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('. ');
};
export { capitalizeAndJoinWords };
