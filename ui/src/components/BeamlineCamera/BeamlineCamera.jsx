import React, { useState } from 'react';
import { Button, Dropdown, Card, Stack } from 'react-bootstrap';
import Draggable from 'react-draggable';

import { MdClose } from 'react-icons/md';

import styles from './beamlineCamera.module.css';
import pip from './picture_in_picture.svg';

function handleImageClick(url, width, height) {
  window.open(
    url,
    'webcam',
    `toolbar=0,location=0,menubar=0,addressbar=0,height=${height},width=${width}`,
    'popup',
  );
}

export default function BeamlineCamera(props) {
  const { cameraSetup } = props;

  const [showVideoModal, setShowVideoModal] = useState({});

  function handleShowVideoModal(key, value) {
    setShowVideoModal({ ...showVideoModal, [key]: value });
  }

  function renderVideo() {
    const DraggableElements = [];
    for (const [key, camera] of cameraSetup.components.entries()) {
      DraggableElements.push(
        showVideoModal[key] ? (
          <div key={`draggable-video_${key}`} className="draggableHandle">
            <Draggable defaultPosition={{ x: 200, y: 100 + 50 * key }}>
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
                        onClick={() => handleShowVideoModal(key, false)}
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
    }
    return DraggableElements;
  }

  function renderCamera() {
    const dropdownItem = [];
    for (const [key, camera] of cameraSetup.components.entries()) {
      dropdownItem.push(
        <Dropdown.Item
          key={key}
          onClick={() => handleShowVideoModal(key, true)}
        >
          {camera.label} <i className="fas fa-video" />
        </Dropdown.Item>,
        <Dropdown.Divider />,
      );
    }
    return dropdownItem;
  }

  return cameraSetup?.components.length > 0 ? (
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
        <Dropdown.Menu>{renderCamera()}</Dropdown.Menu>
      </Dropdown>
      {renderVideo()}
    </>
  ) : null;
}
