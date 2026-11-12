import { useEffect, useRef, useState } from 'react';
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

  // A hidden tab closes the player rather than pausing it: jsmpeg's
  // pauseWhenHidden stops the decoding but not the stream, which piles up
  // and is then decoded one frame per animation frame, so the video stays
  // behind for good. Back on the tab, a new player starts from the live edge.
  const [hidden, setHidden] = useState(document.hidden);

  useEffect(() => {
    function onVisibilityChange() {
      setHidden(document.hidden);
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || format !== 'MPEG1' || hidden) {
      return () => {};
    }

    canvas.width = width;
    canvas.height = height;

    const player = new JSMpeg.Player(source, {
      canvas,
      decodeFirstFrame: false,
      pauseWhenHidden: false,
      preserveDrawingBuffer: true,
      protocols: [],
    });

    player.play();

    return () => {
      player.pause();
      player.source.destroy();
      player.video?.destroy();
    };
  }, [format, source, width, height, hidden]);

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
