import React, { useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Modal } from 'react-bootstrap';
import styles from './imageViewer.module.css';

function GalleryImage(props) {
  return (
    <img
      className={`${styles.image_galery_view} ${props.className}`}
      src={props.src}
      alt={props.alt}
    />
  );
}

function GalleryModal(props) {
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

export default function ImageViewer(props) {
  const [showModal, setShowModal] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  function openModal(url) {
    setShowModal(true);
    setImgUrl(url);
  }

  function closeModal() {
    setShowModal(false);
    setImgUrl('');
  }

  return props.galleryView ? (
    <div className="container-fluid gallery-container">
      <div className="row">
        {props.imgUrls.map((url) => {
          return (
            <div key={url} className="col-sm-6 col-md-3 col-xl-2">
              <div className={styles.gallery_card}>
                <GalleryImage
                  className={styles.gallery_thumbnail}
                  src={url}
                  alt={props.imgAlt}
                />
                <span
                  className={`${styles.viewer_icon_open} fa fa-expand`}
                  onClick={() => openModal(url)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <GalleryModal
        isOpen={showModal}
        handleClose={closeModal}
        src={imgUrl}
        imgTargetX={props.imgTargetX}
        imgTargetY={props.imgTargetY}
        imageName={props.imageName}
      />
    </div>
  ) : (
    <div>
      <div className={styles.gallery_card}>
        <GalleryImage
          className={`${styles.gallery_thumbnail} img-responsive`}
          src={props.imgUrl}
          alt={props.imgAlt}
        />
        <span
          className={`${styles.viewer_icon_open} fa fa-expand`}
          onClick={() => openModal(props.imgUrl)}
        />
      </div>
      <GalleryModal
        isOpen={showModal}
        handleClose={closeModal}
        src={imgUrl}
        imgTargetX={props.imgTargetX}
        imgTargetY={props.imgTargetY}
        imageName={props.imageName}
      />
    </div>
  );
}
