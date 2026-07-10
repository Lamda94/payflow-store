export function isValidExpirationFormat(month: string, year: string): boolean {
  return /^(0[1-9]|1[0-2])$/.test(month) && /^\d{4}$/.test(year);
}

/**
 * A card is valid through the last instant of its expiration month.
 * `referenceDate` is injectable so tests aren't tied to the real clock.
 */
export function isFutureExpiration(
  month: string,
  year: string,
  referenceDate: Date = new Date(),
): boolean {
  if (!isValidExpirationFormat(month, year)) {
    return false;
  }

  const monthNumber = parseInt(month, 10);
  const yearNumber = parseInt(year, 10);
  // Day 0 of the *next* month is the last day of the expiration month.
  const expiresAt = new Date(yearNumber, monthNumber, 0, 23, 59, 59, 999);

  return expiresAt.getTime() >= referenceDate.getTime();
}
