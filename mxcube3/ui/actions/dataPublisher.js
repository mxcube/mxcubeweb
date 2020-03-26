export function setDataPublishers(data) {
  return { type: 'SET_DATA_PUBLISHERS', data };
}

export function updateDataPublisherData(data) {
  return { type: 'UPDATE_DATA_PUBLISHER', data };
}

export function newDataPublisherData(data) {
  return { type: 'NEW_DATA_PUBLISHER_DATA', data };
}
