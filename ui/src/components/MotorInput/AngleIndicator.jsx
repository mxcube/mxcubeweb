import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './AngleIndicator.module.css';

function AngleIndicator({ angle, onChange, onChangeEnd, disabled }) {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const center = 50;
  const radius = 42;

  const radians = (angle * Math.PI) / 180;
  const x = center + radius * Math.cos(radians);
  const y = center + radius * Math.sin(radians);

  const calculateAngleFromEvent = useCallback((e) => {
    if (!svgRef.current) {
      return null;
    }

    const rect = svgRef.current.getBoundingClientRect(); // Get the current mouse coordinates
    const centerX = rect.left + rect.width / 2; // Get the x position of the center of the circle
    const centerY = rect.top + rect.height / 2; // Get the y position of the center of the circle
    const mouseX = e.clientX - centerX; // Get the x distance between the center and the mouse position
    const mouseY = e.clientY - centerY; // Get the y distance between the center and the mouse position
    const rad = Math.atan2(mouseY, mouseX); // Calculates the rad angle corresponding to the mouse position
    let deg = (rad * 180) / Math.PI; // Convert it to degrees
    if (deg < 0) {
      deg += 360; // Puts the value between 0 and 360
    }
    return Math.round(deg);
  }, []);

  function handleMouseDown(e) {
    if (disabled) {
      return;
    }
    setIsDragging(true);
    const newAngle = calculateAngleFromEvent(e);
    if (newAngle !== null && onChange) {
      onChange(newAngle);
    }
  }

  useEffect(() => {
    function handleMouseMove(e) {
      if (isDragging) {
        const newAngle = calculateAngleFromEvent(e);
        if (newAngle !== null && onChange) {
          onChange(newAngle);
        }
      }
    }

    function handleMouseUp(e) {
      if (isDragging) {
        setIsDragging(false);
        const newAngle = calculateAngleFromEvent(e);
        if (newAngle !== null && onChangeEnd) {
          onChangeEnd(newAngle);
        }
      }
    }

    if (isDragging) {
      globalThis.addEventListener('mousemove', handleMouseMove);
      globalThis.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      globalThis.removeEventListener('mousemove', handleMouseMove);
      globalThis.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateAngleFromEvent, onChange, onChangeEnd]);

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox="0 0 100 100"
        aria-label={`Angle actuel : ${angle} degrés`}
        onMouseDown={handleMouseDown}
        style={{
          cursor: disabled
            ? 'not-allowed'
            : isDragging
            ? 'grabbing'
            : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <circle id="circle" cx="50" cy="50" r="42" className={styles.circle} />

        <line x1="50" y1="50" x2={x} y2={y} className={styles.pointer} />

        <circle cx="50" cy="50" r="3" className={styles.center} />

        <text x="50" y="65" textAnchor="middle" className={styles.value}>
          {Number(angle).toFixed(0)}°
        </text>

        <text x="50" y="5" textAnchor="middle" className={styles.label}>
          270°
        </text>

        <text x="100" y="53" textAnchor="middle" className={styles.label}>
          0°
        </text>

        <text x="50" y="99" textAnchor="middle" className={styles.label}>
          90°
        </text>

        <text x="0" y="53" textAnchor="middle" className={styles.label}>
          180°
        </text>
      </svg>
    </div>
  );
}

AngleIndicator.propTypes = {
  angle: PropTypes.number.isRequired,
  onChange: PropTypes.func,
  onChangeEnd: PropTypes.func,
  disabled: PropTypes.bool,
};

AngleIndicator.defaultProps = {
  onChange: null,
  onChangeEnd: null,
  disabled: false,
};

export default AngleIndicator;
