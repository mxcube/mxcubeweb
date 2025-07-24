/* eslint-disable react/destructuring-assignment */
import { useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import styles from './imageViewer.module.css';

export default function GalleryModal(props) {
  const { isOpen, drawTarget } = props;
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (isOpen && drawTarget) {
      _drawTarget();
    }
  });

  function _drawTarget() {
    const context = canvasRef.getContext('2d');

    canvasRef.style.position = 'absolute';
    canvasRef.style.left = `${imageRef.offsetLeft}px`;
    canvasRef.style.top = `${imageRef.offsetTop}px`;

    context.strokeStyle = 'white';
    context.lineWidth = 2;

    context.beginPath();

    context.moveTo(props.imgTargetX - 20, props.imgTargetY - 20);
    context.lineTo(props.imgTargetX + 20, props.imgTargetY + 20);

    context.moveTo(props.imgTargetX + 20, props.imgTargetY - 20);
    context.lineTo(props.imgTargetX - 20, props.imgTargetY + 20);

    context.stroke();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Modal show={isOpen} onHide={props.handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{props.imageName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <TransformWrapper>
          <TransformComponent>
            <img
              ref={imageRef}
              alt=""
              width="100%"
              height="100%"
              className={styles.image_modale_view}
              src={props.src}
            />
            {props.drawTarget ? (
              <canvas ref={canvasRef} aria-label="target_xy" />
            ) : null}
          </TransformComponent>
        </TransformWrapper>
      </Modal.Body>
    </Modal>
  );
}
