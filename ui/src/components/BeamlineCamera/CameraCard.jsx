import { useEffect, useRef } from 'react';
import { Button, Card, Stack } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { MdClose } from 'react-icons/md';

import { JSMpeg } from '../SampleView/jsmpeg.min.js';
import styles from './beamlineCamera.module.css';
import pip from './picture_in_picture.svg';

function handleImageClick(url, width, height) {
  globalThis.open(
    url,
    'webcam',
    `toolbar=0,location=0,menubar=0,addressbar=0,height=${height},width=${width}`,
    'popup',
  );
}

export default function CameraCard(props) {
  const { camera, handleShowVideoCard, cIndex } = props;

  const videoRef = useRef(null);

  useEffect(() => {
    let player;
    if (videoRef.current) {
      player = new JSMpeg.Player(camera.url, {
        canvas: videoRef.current,
        decodeFirstFrame: false,
        preserveDrawingBuffer: false,
        protocols: [],
        autoplay: true,
        displayGl: false,
      });
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [camera.url]);

  return (
    <div key={`draggable-video_${camera.label}`} className="draggableHandle">
      <Draggable defaultPosition={{ x: 200, y: 100 + 50 * cIndex }}>
        <Card className={styles.draggableHandle}>
          <Card.Header>
            <Stack direction="horizontal" gap={3}>
              <div className={styles.headerTitle}>{camera.label}</div>
              <div className="p-2 ms-auto">
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    handleImageClick(camera.url, camera.width, camera.height)
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
                  onClick={() => handleShowVideoCard(cIndex, false)}
                  size="1.5em"
                  className={styles.closeBtn}
                />
              </div>
            </Stack>
          </Card.Header>
          <Card.Body>
            {camera.format === 'jpg' ? (
              <img
                src={camera.url}
                alt={camera.label}
                width={camera.width}
                height={camera.height}
              />
            ) : (
              <canvas
                ref={videoRef}
                id={`video-${camera.label}`}
                style={{ width: '400px', height: '500px' }}
                alt={camera.label}
              />
            )}
          </Card.Body>
        </Card>
      </Draggable>
    </div>
  );
}
