import { fetchAttribute, sendExecuteCommand } from './hardware-object';

function fetchSampleChangerAttribute(attribute) {
  return fetchAttribute('sample_changer', 'sample_changer', attribute);
}

function _sendSampleChangerCommand(cmd, args) {
  return sendExecuteCommand('sample_changer', 'sample_changer', cmd, args);
}

export function fetchSampleChangerContents() {
  return fetchSampleChangerAttribute('get_contents');
}

export function fetchLoadedSample() {
  return fetchSampleChangerAttribute('loaded_sample');
}

export function sendSelectContainer(loc) {
  return _sendSampleChangerCommand('select_location', { loc });
}

export function sendScanSampleChanger(loc) {
  return _sendSampleChangerCommand('scan_location', { loc });
}

export function sendMountSample(sampleData) {
  return _sendSampleChangerCommand('mount_sample', sampleData);
}

export function sendUnmountCurrentSample() {
  return _sendSampleChangerCommand('unmount_current', {});
}

export function sendAbortSampleChanger() {
  return _sendSampleChangerCommand('send_command', {
    cmd: 'abort',
    arguments: '',
  });
}

export function sendSampleChangerCommand(cmd, args) {
  return _sendSampleChangerCommand('send_command', { cmd, arguments: args });
}

export function sendSyncWithCrims() {
  return _sendSampleChangerCommand('sync_with_crims', {});
}
