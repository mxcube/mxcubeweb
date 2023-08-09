import React, { useState } from 'react';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import './style.css';
import pip from './picture_in_picture.svg';

const BeamlineCamera = ({
  labelText,
  url,
  width,
  height,
  optionsOverlay,
  format,
  description,
}) => {
  const [showLabelOverlay, setShowLabelOverlay] = useState(false);
  const [showValueOverlay, setShowValueOverlay] = useState(false);

  const onImageClick = (ev) => {
    setShowValueOverlay(false);
    window.open(
      url,
      'webcam',
      `toolbar=0,location=0,menubar=0,addressbar=0,height=${height},width=${width}`,
      'popup',
    );
  };

  const renderLabel = () => {
    if (!optionsOverlay) {
      return (
        <Badge bg="secondary" style={{ display: 'block', marginBottom: '3px' }}>
          {labelText}
        </Badge>
      );
    }

    return (
      <OverlayTrigger
        show={showLabelOverlay}
        rootClose
        trigger="click"
        placement="bottom"
        overlay={optionsOverlay}
      >
        <div onClick={() => setShowLabelOverlay(!showLabelOverlay)}>
          <Badge
            bg="secondary"
            style={{ display: 'block', marginBottom: '3px' }}
          >
            {labelText}
            <i className="fas fa-cog ms-2" />
          </Badge>
        </div>
      </OverlayTrigger>
    );
  };

  const msgLabelStyle = {
    display: 'block',
    fontSize: '100%',
    borderRadius: '0px',
    color: '#000',
  };

  const video = (
    <div>
      {format != 'mp4' ? (
        <img
          onClick={onImageClick}
          src={url}
          alt={labelText}
          width={width}
          height={height}
        />
      ) : (
        <video
          src={url}
          alt={labelText}
          onClick={onImageClick}
          width={width}
          height={height}
        ></video>
      )}
      <Button
        variant="outline-secondary"
        onClick={onImageClick}
        size="sm"
        style={{ position: 'absolute', left: '90%', bottom: '10px' }}
      >
        <img src={pip} alt="PIP Icon" />
      </Button>
    </div>
  );

  return (
    <div className="inout-switch">
      {renderLabel()}
      <OverlayTrigger
        show={showValueOverlay}
        rootClose
        trigger="click"
        placement="bottom"
        overlay={
          <Popover style={{ padding: '0.5em' }} id={`${labelText} popover`}>
            {video}
          </Popover>
        }
      >
        <div onClick={() => setShowValueOverlay(!showValueOverlay)}>
          <Badge bg="success" style={msgLabelStyle}>
            <i className="fas fa-video" />
          </Badge>
        </div>
      </OverlayTrigger>
    </div>
  );
};

BeamlineCamera.defaultProps = {
  labelText: '',
  width: 0,
  height: 0,
  url: '',
  optionsOverlay: false,
  format: '',
};

export default BeamlineCamera;
