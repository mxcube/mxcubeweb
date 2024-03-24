import React, { useState } from 'react';
import { Button, Dropdown, Card } from 'react-bootstrap';
import Draggable from 'react-draggable';

import { MdClose } from 'react-icons/md';

import styles from './styles.module.css';
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

  const renderVideo = (key, labelText, format, url, width, height) => (
    <Draggable key={key}>
      <Card>
        <Card.Header>
          <Card.Title>
            {labelText}
            <Button
              variant="outline-secondary"
              onClick={() => handleImageClick(url, width, height)}
              size="sm"
              style={{ position: 'absolute', left: '88%', top: '7px' }}
            >
              <img src={pip} alt="PIP Icon" />
            </Button>
            <MdClose
              color="red"
              onClick={() => handleShowVideoModal(key, false)}
              size="1.5em"
              style={{ position: 'absolute', left: '95%', top: '10px' }}
              className={styles.closeBtn}
            />
          </Card.Title>
        </Card.Header>
        <Card.Body>
          {format !== 'mp4' ? (
            <img src={url} alt={labelText} width={width} height={height} />
          ) : (
            <video src={url} alt={labelText} width={width} height={height} />
          )}
        </Card.Body>
      </Card>
    </Draggable>
  );

  function renderCameraComponent() {
    const acts = [];
    const elements = [];
    if (cameraSetup) {
      for (const [key, camera] of cameraSetup.components.entries()) {
        acts.push(
          <Dropdown.Item
            key={key}
            onClick={() => handleShowVideoModal(key, true)}
          >
            {camera.label} <i className="fas fa-video" />
          </Dropdown.Item>,
          <Dropdown.Divider />,
        );
        elements.push(
          showVideoModal[key]
            ? renderVideo(
                key,
                camera.label,
                camera.attribute,
                camera.url,
                camera.width,
                camera.height,
              )
            : null,
        );
      }
    }
    return [acts, elements];
  }

  return [
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
      <Dropdown.Menu>{renderCameraComponent()[0]}</Dropdown.Menu>
    </Dropdown>,
    renderCameraComponent()[1],
  ];
}
