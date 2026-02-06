export function processChatMessageRecord(record, currentUsername) {
  const isSelf = record.username === currentUsername;

  const date = record.date ? new Date(record.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('Invalid date');
  }

  return {
    id: record.id || `${isSelf ? 'u' : 'r'}-${Date.now()}-${Math.random()}`,
    type: isSelf ? 'user' : 'response',
    name: isSelf ? 'You' : record.nickname || '',
    message: record.message || '',
    isSelf,
    read: record.read !== undefined ? record.read : false,
    date: date.toISOString(),
  };
}
