function normalizeDateToISO(dateString) {
  let normalizedDate = new Date().toISOString();
  if (dateString) {
    try {
      const parsedDate = new Date(dateString);
      if (!Number.isNaN(parsedDate.getTime())) {
        normalizedDate = parsedDate.toISOString();
      }
    } catch {
      // Ignore
    }
  }
  return normalizedDate;
}

export function processChatMessageRecord(record, currentUsername) {
  const isSelf = record.username === currentUsername;
  const normalizedDate = normalizeDateToISO(record.date);

  return {
    id: record.id || `${isSelf ? 'u' : 'r'}-${Date.now()}-${Math.random()}`,
    type: isSelf ? 'user' : 'response',
    text: isSelf
      ? `**You:** \n\n ${record.message} \n\n`
      : `**${record.nickname}:** \n\n ${record.message}`,
    date: normalizedDate,
  };
}
