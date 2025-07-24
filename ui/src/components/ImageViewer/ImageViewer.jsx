/* eslint-disable react/destructuring-assignment */
import { useState } from 'react';

import GalleryModal from './GalleryModal';
import styles from './imageViewer.module.css';

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
                <img
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
        <img
          className={`${styles.gallery_thumbnail} img-fluid`}
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
