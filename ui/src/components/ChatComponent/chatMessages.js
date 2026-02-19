export function processChatMessageRecord(record, currentUsername) {
  const isSelf = record.username === currentUsername;

  let date;

  if (record.date) {
    date = new Date(record.date);
    if (Number.isNaN(date.getTime()) && /^\d{2}:\d{2}$/u.test(record.date)) {
      const [hours, minutes] = record.date.split(':');
      date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);
    }
  } else {
    date = new Date();
  }

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
