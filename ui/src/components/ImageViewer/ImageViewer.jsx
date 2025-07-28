import { useState } from 'react';

import GalleryModal from './GalleryModal';
import styles from './imageViewer.module.css';

export default function ImageViewer(props) {
  const { galleryView, imgUrls, imgAlt, imgTargetX, imgTargetY, imageName } =
    props;

  const [showModal, setShowModal] = useState(false);
  const [imgUrl, setImgUrl] = useState('');

  function openModal(url) {
    setShowModal(true);
    setImgUrl(url);
  }

  function closeModal() {
    setShowModal(false);
    setImgUrl('');
  }

  return galleryView ? (
    <div className="container-fluid gallery-container">
      <div className="row">
        {imgUrls.map((url) => {
          return (
            <div key={url} className="col-sm-6 col-md-3 col-xl-2">
              <div className={styles.gallery_card}>
                <img
                  className={styles.gallery_thumbnail}
                  src={url}
                  alt={imgAlt}
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
        imgTargetX={imgTargetX}
        imgTargetY={imgTargetY}
        imageName={imageName}
      />
    </div>
  ) : (
    <div>
      <div className={styles.gallery_card}>
        <img
          className={`${styles.gallery_thumbnail} img-fluid`}
          src={imgUrl}
          alt={imgAlt}
        />
        <span
          className={`${styles.viewer_icon_open} fa fa-expand`}
          onClick={() => openModal(imgUrl)}
        />
      </div>
      <GalleryModal
        isOpen={showModal}
        handleClose={closeModal}
        src={imgUrl}
        imgTargetX={imgTargetX}
        imgTargetY={imgTargetY}
        imageName={imageName}
      />
    </div>
  );
}
