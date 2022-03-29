export function showList(listName) {
  return {
    type: 'SHOW_LIST',
    list_name: listName,
  };
}

export function collapseItem(queueID) {
  return {
    type: 'COLLAPSE_ITEM',
    queueID,
  };
}

export function selectItem(queueID) {
  return {
    type: 'SELECT_ITEM',
    queueID,
  };
}

export function showResumeQueueDialog(show = true) {
  return {
    type: 'SHOW_RESUME_QUEUE_DIALOG',
    show,
  };
}

export function showConfirmCollectDialog(show = true) {
  return {
    type: 'SHOW_CONFIRM_COLLECT_DIALOG',
    show,
  };
}
