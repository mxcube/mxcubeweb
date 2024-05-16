import React, { useRef, useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Modal } from 'react-bootstrap';
import './ImageViewer.css';

function GalleryImage(props) {
  return (
    <img
      className={`image_galery_view ${props.className}`}
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
              className="image_modale_view"
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
  const [url, setUrl] = useState('');

  function openModal(url) {
    setShowModal(true);
    setUrl(url);
  }

  function closeModal() {
    setShowModal(false);
    setUrl('');
  }

  return props.galleryView ? (
    <div className="container-fluid gallery-container">
      <div className="row">
        {props.imgUrls.map((imgUrl) => {
          return (
            <div key={imgUrl} className="col-sm-6 col-md-3 col-xl-2">
              <div className="gallery-card">
                <GalleryImage
                  className="gallery-thumbnail"
                  src={imgUrl}
                  alt={props.imgAlt}
                />
                <span
                  className="viewer-icon-open fa fa-expand"
                  onClick={() => openModal(imgUrl)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <GalleryModal
        isOpen={showModal}
        handleClose={closeModal}
        src={url}
        imgTargetX={props.imgTargetX}
        imgTargetY={props.imgTargetY}
        imageName={props.imageName}
      />
    </div>
  ) : (
    <div>
      <div className="gallery-card">
        <GalleryImage
          className="gallery-thumbnail img-responsive"
          src={props.imgUrl}
          alt={props.imgAlt}
        />
        <span
          className="viewer-icon-open fa fa-expand"
          // value={props.imgUrl}
          onClick={() => openModal(props.imgUrl)}
        />
      </div>
      <GalleryModal
        isOpen={showModal}
        handleClose={closeModal}
        src={url}
        imgTargetX={props.imgTargetX}
        imgTargetY={props.imgTargetY}
        imageName={props.imageName}
      />
    </div>
  );
}
