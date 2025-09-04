import { sendExecuteCommand } from '../api/hardware-object';

export function applicationFetched(data) {
  return { type: 'APPLICATION_FETCHED', data };
}

export function showErrorPanel(show, message = '') {
  return {
    type: 'SHOW_ERROR_PANEL',
    show,
    message,
  };
}

export function showDialog(show, t, title = '', data = null) {
  return {
    type: 'SHOW_DIALOG',
    show,
    t,
    title,
    data,
  };
}

export function showConnectionLostDialog(show = true) {
  return {
    type: 'SHOW_CONNECTION_LOST_DIALOG',
    show,
  };
}

export function showConfirmClearQueueDialog(show = true) {
  return {
    type: 'SHOW_CONFIRM_CLEAR_QUEUE_DIALOG',
    show,
  };
}

export function displayImage(path, imgNum) {
  return async () => {
    const data = await sendExecuteCommand(
      'detector',
      'detector',
      'display_image',
      { path, imgNum },
    );
    window.open(
      `https://braggy.mxcube3.esrf.fr/?file=${data.path}/image_${data.img_num}.h5.dataset`,
      'braggy',
    );
  };
}
