/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-then */

import fetch from 'isomorphic-fetch';

export function addUserMessage(records, target) {
  return {
    type: 'ADD_USER_MESSAGE',
    records,
    target,
  };
}

export function removeUserMessage(messageID) {
  return { type: 'REMOVE_USER_MESSAGE', messageID };
}

export function clearAllUserMessages() {
  return { type: 'CLEAR_ALL_USER_MESSAGES' };
}

export function applicationFetched(data) {
  return { type: 'APPLICATION_FETCHED', data };
}

export function setLoading(
  loading,
  title = '',
  message = '',
  blocking = false,
  abortFun = undefined,
) {
  return {
    type: 'SET_LOADING',
    loading,
    title,
    message,
    blocking,
    abortFun,
  };
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

export function sendDisplayImage(path, imgNum) {
  return () => {
    fetch(
      `mxcube/api/v0.1/detector/display_image/?path=${path}&img_num=${imgNum}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-type': 'application/json',
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        window.open(
          `https://braggy.mxcube3.esrf.fr/?file=${data.path}/image_${data.img_num}.h5.dataset`,
          'braggy',
        );
      });
  };
}
