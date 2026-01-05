export const cx = (...parts: Array<string | false | null | undefined | 0>) => {
  return parts.filter(Boolean).join(' ');
};

export const convertNumericToTime = (value: number): string => {
  const hours = Math.floor(value);
  const minutes = Math.round((value % 1) * 60);
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes}`;
};
