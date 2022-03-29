export function addLogRecord(data) {
  return { type: 'ADD_LOG_RECORD', data };
}

export function setLogPage(page) {
  return { type: 'SET_PAGE_LOGGING', page };
}
