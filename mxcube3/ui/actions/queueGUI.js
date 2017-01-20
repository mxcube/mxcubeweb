export function showList(listName) {
  return {
    type: 'SHOW_LIST',
    list_name: listName
  };
}


export function collapseSample(sampleID) {
  return {
    type: 'COLLAPSE_SAMPLE', sampleID
  };
}


export function collapseTask(sampleID, taskIndex) {
  return {
    type: 'COLLAPSE_TASK', sampleID, taskIndex
  };
}


export function showResumeQueueDialog(show = true) {
  return {
    type: 'SHOW_RESUME_QUEUE_DIALOG', show
  };
}

