function parseDate(yyyymmdd) {
  const year = yyyymmdd.slice(0, 4);
  const month = yyyymmdd.slice(4, 6);
  const day = yyyymmdd.slice(6, 8);
  return new Date(`${year}-${month}-${day}`);
}

export function isDateInRange(startDateStr, endDateStr, rangeInDays) {
  // Helper function to parse YYYYMMDD format into Date object
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);

  // Get today's date without time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the lower and upper bounds based on the rangeInDays
  const lowerBound = new Date(today);
  lowerBound.setDate(today.getDate() - rangeInDays);

  const upperBound = new Date(today);
  upperBound.setDate(today.getDate() + rangeInDays);

  // Check if any date in the range (today ± rangeInDays) falls within the given date range
  return lowerBound <= endDate && upperBound >= startDate;
}
