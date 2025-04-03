import { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import CameraCard from './CameraCard';

export default function BeamlineCamera() {
  const cameraComponents = useSelector(
    (state) => state.uiproperties?.camera_setup?.components,
  );
  const argusStreams = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );
  const streamProxyUrl = useSelector(
    (state) =>
      state.beamline.hardwareObjects.argus?.attributes?.stream_proxy_url,
  );

  const [showVideoModal, setShowVideoModal] = useState({});
  const [cameras, setCameras] = useState(cameraComponents);

  function handleShowVideoCard(key, value) {
    setShowVideoModal({ ...showVideoModal, [key]: value });
  }

  useEffect(() => {
    if (argusStreams) {
      const argusCameras = Object.keys(argusStreams).map((key) => {
        return {
          description: null,
          format: null,
          height: 1280,
          width: 960,
          label: key,
          url: `${streamProxyUrl}/${key}`,
        };
      });
      if (cameraComponents && cameraComponents.length > 0) {
        setCameras([...cameraComponents, ...argusCameras]);
      } else {
        setCameras(argusCameras);
      }
    }
  }, [argusStreams, cameraComponents, streamProxyUrl]);

  if (!cameras || cameras.length <= 0) {
    return null;
  }

  return (
    <>
      <Dropdown
        title="Beamline Cameras"
        id="beamline-cameras-dropdown"
        variant="outline-secondary"
        autoClose="outside"
        key="beamline-cameras-dropdown"
      >
        <Dropdown.Toggle
          variant="outline-secondary"
          size="sm"
          className="mb-1"
          style={{ width: '150px' }}
        >
          Beamline Cameras
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {cameras.map((camera, cIndex) => [
            <Dropdown.Item
              key={`ddVideo_${camera.label}`}
              onClick={() => handleShowVideoCard(cIndex, true)}
            >
              {camera.label} <i className="fas fa-video" />
            </Dropdown.Item>,
            cameras.length > cIndex + 1 && <Dropdown.Divider />,
          ])}
        </Dropdown.Menu>
      </Dropdown>
      {cameras.map(
        (camera, cIndex) =>
          showVideoModal[cIndex] && (
            <CameraCard
              camera={camera}
              cIndex={cIndex}
              handleShowVideoCard={handleShowVideoCard}
              key={`CameraCard_${camera.label}`}
            />
          ),
      )}
    </>
  );
}
