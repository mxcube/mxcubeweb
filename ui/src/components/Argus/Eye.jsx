import { useEffect, useState } from 'react';

import styles from './Eye.module.css';

function Eye({ recording }) {
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMouseMove(event) {
      const eye = document.querySelector(`.${styles.eye}`);
      const rect = eye.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const angle = Math.atan2(
        event.clientY - eyeCenterY,
        event.clientX - eyeCenterX,
      );
      const distance = Math.min(rect.width / 4, rect.height / 4);
      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;

      setPupilPosition({ x: pupilX, y: pupilY });
    }

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className={styles.eye}>
      {recording && <div className={styles.recordingIndicator} />}
      <div
        className={styles.pupil}
        style={{
          transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        }}
      />
    </div>
  );
}

export default Eye;
