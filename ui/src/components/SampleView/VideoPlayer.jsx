import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { JSMpeg } from './jsmpeg.min.js';
import styles from './VideoPlayer.module.css';

export default function VideoPlayer() {
  const width = useSelector((state) => state.sampleview.width);
  const height = useSelector((state) => state.sampleview.height);
  const format = useSelector((state) => state.sampleview.videoFormat);
  const source = useSelector((state) => {
    const { videoURL, videoHash } = state.sampleview;
    return videoURL ? `${videoURL}/${videoHash}` : undefined;
  });

  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || format !== 'MPEG1') {
      return () => {};
    }

    canvas.width = width;
    canvas.height = height;

    const player = new JSMpeg.Player(source, {
      canvas,
      decodeFirstFrame: false,
      preserveDrawingBuffer: true,
      protocols: [],
    });

    player.play();

    return () => {
      player.pause();
      player.source.destroy();
      player.video?.destroy();
    };
  }, [format, source, width, height]);

  if (!source) {
    return null;
  }

  if (format === 'MJPEG') {
    return <img id="sample-img" className={styles.video} src={source} alt="" />;
  }

  if (format === 'MPEG1') {
    return (
      <canvas
        ref={canvasRef}
        id="sample-img"
        className={styles.video}
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }

  return null;
}
