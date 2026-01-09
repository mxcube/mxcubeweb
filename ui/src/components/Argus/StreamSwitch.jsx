import { useState } from 'react';
import { useSelector } from 'react-redux';

import { StreamDropdown } from './StreamDropdown.jsx';
import { StreamMonitors } from './StreamMonitors.jsx';

export function StreamSwitch(props) {
  const { handleSourceSwitch } = props;
  const cameras = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );
  const [streammode, setStreammode] = useState('monitors');

  return (
    cameras ? (
      <div style={{ textAlign: 'center' }}>
        {streammode === 'monitors' && (
          <StreamMonitors handleSourceSwitch={handleSourceSwitch} />
        )}
        {streammode === 'dropdown' && (
          <StreamDropdown handleSourceSwitch={handleSourceSwitch} />
        )}
        <button
          type="button"
          onClick={() => {
            setStreammode(streammode === 'monitors' ? 'dropdown' : 'monitors');
          }}
          style={{ display: 'block', margin: '10px auto' }}
        >
          Switch Stream Mode
        </button>
      </div>
    ) : (<div></div>)
  );
}
