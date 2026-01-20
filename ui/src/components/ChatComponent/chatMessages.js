export function processChatMessageRecord(record, currentUsername) {
  const isSelf = record.username === currentUsername;

  let date = record.date ? new Date(record.date) : new Date();
  if (Number.isNaN(date.getTime())) {
    // eslint-disable-next-line no-console
    console.error('Invalid date provided:', record.date);
    date = new Date(); // Use current date as fallback
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
