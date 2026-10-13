import PropTypes from 'prop-types';
import { useCallback, useRef, useState } from 'react';

import styles from './AngleIndicator.module.css';

function AngleIndicator({ angle, onChange, onChangeEnd, disabled }) {
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const center = 50;
  const radius = 42;

  const radians = (angle * Math.PI) / 180;
  const x = center + radius * Math.cos(radians);
  const y = center + radius * Math.sin(radians);

  const calculateAngle = useCallback((e) => {
    if (!svgRef.current) {
      return null;
    }

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    const rad = Math.atan2(mouseY, mouseX);
    let deg = ((rad * 180) / Math.PI) % 360;
    if (deg < 0) {
      deg += 360;
    }
    return Math.round(deg);
  }, []);

  function handlePointerDown(e) {
    if (disabled || e.button !== 0) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const newAngle = calculateAngle(e);
    if (newAngle !== null && onChange) {
      onChange(newAngle);
    }
  }

  function handlePointerMove(e) {
    if (!isDragging) {
      return;
    }

    const newAngle = calculateAngle(e);
    if (newAngle !== null && onChange) {
      onChange(newAngle);
    }
  }

  function handlePointerUp(e) {
    if (!isDragging) {
      return;
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    const newAngle = calculateAngle(e);
    if (newAngle !== null && onChangeEnd) {
      onChangeEnd(newAngle);
    }
  }
  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox="0 0 100 100"
        aria-label={`Current Angle : ${angle} degree${angle === 1 ? '' : 's'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          cursor: disabled
            ? 'not-allowed'
            : isDragging
            ? 'grabbing'
            : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <circle
          id="circle"
          cx={center}
          cy={center}
          r={radius}
          className={styles.circle}
        />

        <line
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          className={styles.pointer}
        />

        <circle cx={center} cy={center} r="3" className={styles.center} />

        <text
          x={center}
          y={center * 1.3}
          textAnchor="middle"
          className={styles.value}
        >
          {Number(angle).toFixed(0)}°
        </text>

        <text
          x={center}
          y={center - radius * 1.2}
          textAnchor="middle"
          className={styles.label}
        >
          270°
        </text>

        <text
          x={center + radius * 1.2}
          y={center * 1.05}
          textAnchor="middle"
          className={styles.label}
        >
          0°
        </text>

        <text
          x={center}
          y={center + radius * 1.2}
          textAnchor="middle"
          className={styles.label}
        >
          90°
        </text>

        <text
          x={center - radius * 1.2}
          y={center * 1.05}
          textAnchor="middle"
          className={styles.label}
        >
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
