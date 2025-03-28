import { useState } from 'react';
import { Button, Dropdown, Card, Stack } from 'react-bootstrap';
import Draggable from 'react-draggable';

import { MdClose } from 'react-icons/md';

import styles from './beamlineCamera.module.css';
import pip from './picture_in_picture.svg';
import { useSelector } from 'react-redux';

function handleImageClick(url, width, height) {
  window.open(
    url,
    'webcam',
    `toolbar=0,location=0,menubar=0,addressbar=0,height=${height},width=${width}`,
    'popup',
  );
}

export default function BeamlineCamera() {
  const cameraComponents = useSelector(
    (state) => state.uiproperties?.camera_setup?.components,
  );

  const [showVideoModal, setShowVideoModal] = useState({});

  function handleShowVideoCard(key, value) {
    setShowVideoModal({ ...showVideoModal, [key]: value });
  }

  function renderVideo() {
    const DraggableElements = [];
    cameraComponents.forEach((camera, vIndex) => {
      DraggableElements.push(
        showVideoModal[vIndex] ? (
          <div
            key={`draggable-video_${camera.label}`}
            className="draggableHandle"
          >
            <Draggable defaultPosition={{ x: 200, y: 100 + 50 * vIndex }}>
              <Card className={styles.draggableHandle}>
                <Card.Header>
                  <Stack direction="horizontal" gap={3}>
                    <div className={styles.headerTitle}>{camera.label}</div>
                    <div className="p-2 ms-auto">
                      <Button
                        variant="outline-secondary"
                        onClick={() =>
                          handleImageClick(
                            camera.url,
                            camera.width,
                            camera.height,
                          )
                        }
                        size="sm"
                      >
                        <img src={pip} alt="PIP Icon" />
                      </Button>
                    </div>
                    <div className="vr" />
                    <div>
                      <MdClose
                        color="red"
                        onClick={() => handleShowVideoCard(vIndex, false)}
                        size="1.5em"
                        className={styles.closeBtn}
                      />
                    </div>
                  </Stack>
                </Card.Header>
                <Card.Body>
                  {camera.format !== 'mp4' ? (
                    <img
                      src={camera.url}
                      alt={camera.label}
                      width={camera.width}
                      height={camera.height}
                    />
                  ) : (
                    <video
                      src={camera.url}
                      alt={camera.label}
                      width={camera.width}
                      height={camera.height}
                    />
                  )}
                </Card.Body>
              </Card>
            </Draggable>
          </div>
        ) : null,
      );
    });
    return DraggableElements;
  }

  if (!cameraComponents || cameraComponents.length <= 0) {
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
          {cameraComponents.map((camera, cIndex) => [
            <Dropdown.Item
              key={`ddVideo_${camera.label}`}
              onClick={() => handleShowVideoCard(cIndex, true)}
            >
              {camera.label} <i className="fas fa-video" />
            </Dropdown.Item>,
            cameraComponents.length > cIndex + 1 && <Dropdown.Divider />,
          ])}
        </Dropdown.Menu>
      </Dropdown>
      {renderVideo()}
    </>
  );
}
