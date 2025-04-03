import { useState } from 'react';
import { useSelector } from 'react-redux';

import { StreamDropdown } from './StreamDropdown.jsx';
import { StreamMonitors } from './StreamMonitors.jsx';

export function StreamSwitch() {
  const cameras = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );
  const [streammode, setStreammode] = useState('monitors');

  return (
    <div>
      {cameras && (
        <div style={{ textAlign: 'center' }}>
          {streammode === 'monitors' && <StreamMonitors />}
          {streammode === 'dropdown' && <StreamDropdown />}
          <button
            type="button"
            onClick={() => {
              setStreammode(
                streammode === 'monitors' ? 'dropdown' : 'monitors',
              );
            }}
            style={{ display: 'block', margin: '10px auto' }}
          >
            Switch Stream Mode
          </button>
        </div>
      )}
    </div>
  );
}
