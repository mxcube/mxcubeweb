import { serverIO } from '../serverIO';

export function setMaster(master) {
  if (master) {
    return function (dispatch) {
      serverIO.setRemoteAccessMaster(() => {
        dispatch({ type: 'SET_MASTER', master });
      });
    };
  }
  return { type: 'SET_MASTER', master };
}

