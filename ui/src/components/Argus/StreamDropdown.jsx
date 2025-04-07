import { useSelector } from 'react-redux';

export function StreamDropdown(props) {
  const { handleSourceSwitch } = props;
  const cameras = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );
  return (
    <select
      title="Camera Streams"
      id="streams-dropdown"
      onChange={(event) => {
        handleSourceSwitch(event.target.value);
      }}
    >
      <option value="">-- Streams --</option>
      {cameras
        ? Object.entries(cameras).map((stream) => {
            const key = stream.slice(0, 1);
            const url = `ws://localhost:7000/ws/${stream.slice(0, 1)}`;
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
