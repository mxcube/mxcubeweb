import { serverIO } from '../serverIO';

export function setMaster(master) {
  if (master) {
    return function (dispatch) {
      serverIO.setRemoteAccessMaster((sid) => {
        dispatch({ type: 'SET_MASTER', master, sid });
      });
    };
  }
  return { type: 'SET_MASTER', master, sid: null };
}

