import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import styles from './imageViewer.module.css';

export default function GalleryModal(props) {
  const {
    handleClose,
    isOpen,
    drawTarget,
    imgTargetX,
    imgTargetY,
    imageName,
    src,
  } = props;

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
    context.moveTo(imgTargetX - 20, imgTargetY - 20);
    context.lineTo(imgTargetX + 20, imgTargetY + 20);
    context.moveTo(imgTargetX + 20, imgTargetY - 20);
    context.lineTo(imgTargetX - 20, imgTargetY + 20);
    context.stroke();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <Modal show={isOpen} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{imageName}</Modal.Title>
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
              src={src}
            />
            {drawTarget && <canvas ref={canvasRef} aria-label="target_xy" />}
          </TransformComponent>
        </TransformWrapper>
      </Modal.Body>
    </Modal>
  );
}

GalleryModal.propTypes = {
  handleClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  drawTarget: PropTypes.bool,
  imgTargetX: PropTypes.number,
  imgTargetY: PropTypes.number,
  imageName: PropTypes.string,
  src: PropTypes.string,
};
