import api from './api';

const endpoint = api.url('/queue');

export function fetchQueueState() {
  return endpoint.get('/queue_state').safeJson();
}

export function fetchAvailableTasks() {
  return endpoint.get('/available_tasks').safeJson();
}

export function sendAddQueueItem(items) {
  return endpoint.post(items, '/').safeJson();
}

export function sendUpdateQueueItem(sid, tindex, data) {
  return endpoint.post(data, `/${sid}/${tindex}`).safeJson();
}

export function sendDeleteQueueItem(itemPosList) {
  return endpoint.post(itemPosList, '/delete').res();
}

export function sendSetEnabledQueueItem(qidList, value) {
  return endpoint.post({ qidList, value }, '/set_enabled').res();
}

export function sendClearQueue() {
  return endpoint.put(undefined, '/clear').res();
}

export function sendStartQueue(autoMountNext, sid) {
  return endpoint.put({ autoMountNext, sid }, '/start').res();
}

export function sendPauseQueue() {
  return endpoint.put(undefined, '/pause').res();
}

export function sendResumeQueue() {
  return endpoint.put(undefined, '/unpause').res();
}

export function sendStopQueue() {
  return endpoint.put(undefined, '/stop').res();
}

export function sendRunSample(sampleID, taskIndex) {
  return endpoint.put(undefined, `/${sampleID}/${taskIndex}/execute`).res();
}

export function sendToggleCheckBox(queueID) {
  return endpoint.put(undefined, `/${queueID}/toggle`).res();
}

export function sendSetAutoMountSample(automount) {
  return endpoint.post({ automount }, '/automount').safeJson();
}

export function sendSetAutoAddDiffPlan(autoadddiffplan) {
  return endpoint.post({ autoadddiffplan }, '/auto_add_diffplan').safeJson();
}

export function sendSetNumSnapshots(numSnapshots) {
  return endpoint.put({ numSnapshots }, '/num_snapshots').res();
}

export function sendSetGroupFolder(path) {
  return endpoint.post({ path }, '/group_folder').safeJson();
}

export function sendSetQueueSettings(name, value) {
  return endpoint.post({ name, value }, '/setting').res();
}

export function sendUpdateDependentFields(task_name, field_data) {
  return endpoint
    .post({ task_name, field_data }, '/update_dependent_field')
    .safeJson();
}
