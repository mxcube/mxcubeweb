import { useDispatch, useSelector } from 'react-redux';

import { setVideoSource } from '../../actions/sampleview.js';

export function StreamDropdown() {
  const cameras = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );
  const streamProxyUrl = useSelector(
    (state) =>
      state.beamline.hardwareObjects.argus?.attributes?.stream_proxy_url,
  );
  const dispatch = useDispatch();
  return (
    <select
      title="Camera Streams"
      id="streams-dropdown"
      onChange={(event) => {
        const splitIndex = event.target.value.lastIndexOf('/');
        const [url, hash] = [
          event.target.value.slice(0, splitIndex),
          event.target.value.slice(splitIndex + 1),
        ];
        dispatch(setVideoSource(url, hash));
      }}
    >
      <option value="">-- Streams --</option>
      {cameras
        ? Object.entries(cameras).map((stream) => {
            const key = stream.slice(0, 1);
            const url = `${streamProxyUrl}/${stream.slice(0, 1)}`;
            return (
              <option key={key} value={url}>
                {' '}
                {key}{' '}
              </option>
            );
          })
        : null}
    </select>
  );
}
