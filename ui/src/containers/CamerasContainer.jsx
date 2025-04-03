import { useSelector } from 'react-redux';

import VideoPlayer from '../components/SampleView/VideoPlayer';

function CamerasContainer() {
  const argusAttributes = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes,
  );

  if (!argusAttributes) {
    return <div />;
  }

  const { camera_streams, stream_proxy_url } = argusAttributes;
  const count = Object.keys(camera_streams).length;
  const cols = Math.ceil(Math.log2(count)) + 1; // round up to the nearest power of 2 for better layout
  const rows = Math.ceil(count / cols);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        padding: '0px 20px',
        gap: '10px',
        height: '100%',
        width: '100%',
        overflow: 'auto',
      }}
    >
      {Object.keys(camera_streams).map((hash) => (
        <VideoPlayer
          key={`camera-player-${hash}`}
          format="MPEG1"
          source={stream_proxy_url ? `${stream_proxy_url}/${hash}` : undefined}
          width={`${100 / cols}%`}
          height={`${100 / rows}%`}
        />
      ))}
    </div>
  );
}

export default CamerasContainer;
