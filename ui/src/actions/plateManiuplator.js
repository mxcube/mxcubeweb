import fetch from 'isomorphic-fetch';
import { showErrorPanel } from './general';
import { clearCurrentSample } from './queue';



export function loadPlateSample(sampleData, successCb = null) {
    return function (dispatch, getState) {
      console.log("即将要上的Plate样品是: ")
      console.log(sampleData)
  
      const state = getState();
      if (state.sampleChanger.plateMode === 'True'){

        if (state.sampleChanger.loadedSample.address !== sampleData.location) {
            fetch('mxcube/api/v0.1/sample_changer/mountplatesample', {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-type': 'application/json',
            },
            body: JSON.stringify(sampleData),
            }).then((response) => {
            if (response.status >= 400) {
                dispatch(showErrorPanel(true, response.headers.get('message')));  //考虑注释
                throw new Error('Server refused to mount sample');                // 考虑注释
            } else if (successCb) {
                successCb();
            }
            });
        }
      }
    };
  }