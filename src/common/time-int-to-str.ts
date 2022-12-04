export function getTimeStr(time: number): string {
  const dayStartTimeString = time.toString().padStart(4, '0');
  return `${dayStartTimeString.slice(
    0,
    2,
  )}:${dayStartTimeString.slice(2, 4)}`;
}