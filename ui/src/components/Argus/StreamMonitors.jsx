import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { JSMpeg } from '../SampleView/jsmpeg.min.js';
import styles from './StreamMonitors.module.css';

function updatePlayers(prevPlayers, cameras) {
  let new_players = {};
  // remove all JSMpeg players from streams that have been removed
  if (prevPlayers) {
    new_players = Object.fromEntries(
      Object.entries(prevPlayers).filter(([key]) => {
        if (!Object.keys(cameras).includes(key)) {
          prevPlayers[key].destroy();
          return false;
        }
        return true;
      }),
    );
  }

  // add players for new streams
  Object.keys(cameras).forEach((key) => {
    if (prevPlayers && !prevPlayers[key]) {
      const curr_canv = document.querySelector(`#${key}-canv`);
      const url = `ws://localhost:7000/ws/${key}`;
      new_players[key] = new JSMpeg.Player(url, {
        canvas: curr_canv,
        decodeFirstFrame: true,
        preserveDrawingBuffer: false,
        protocols: [],
      });
      new_players[key].stop();
      curr_canv.src = url;
    }
  });

  return new_players;
}

export function StreamMonitors(props) {
  const { handleSourceSwitch, numberOfShownMonitors = 3 } = props;
  const [players, setPlayers] = useState({});
  const [currentMonitor, setCurrentMonitor] = useState(0);
  const cameras = useSelector(
    (state) => state.beamline.hardwareObjects.argus?.attributes?.camera_streams,
  );

  useEffect(() => {
    if (cameras) {
      setPlayers((prevPlayers) => updatePlayers(prevPlayers, cameras));

      setCurrentMonitor((prevMonitor) =>
        Math.max(
          prevMonitor,
          Object.entries(cameras).length - numberOfShownMonitors,
        ),
      );
    }
  }, [cameras, numberOfShownMonitors]);

  useEffect(() => {
    if (!cameras) {
      return;
    }

    const cameraKeys = Object.keys(cameras);

    // hide all canvases
    cameraKeys.forEach((key) => {
      const curr_button = document.querySelector(`#${key}-button`);
      if (curr_button) {
        curr_button.style.display = 'none';
      }
    });

    // show necessary canvases
    for (
      let pos = currentMonitor;
      pos <= Math.min(cameraKeys.length - 1, currentMonitor + 2);
      pos++
    ) {
      const curr_button = document.querySelector(`#${cameraKeys[pos]}-button`);
      if (curr_button) {
        curr_button.style.display = 'inline';
      }
    }
  }, [currentMonitor, cameras]);

  return (
    <div style={{ verticalAlign: 'center' }}>
      {cameras && Object.entries(cameras).length > numberOfShownMonitors ? (
        <button
          type="button"
          style={{ border: 'none', background: 'none', width: '4%' }}
          onClick={() => {
            setCurrentMonitor((prevCurrent) => Math.max(0, prevCurrent - 1));
          }}
        >
          <div
            className={styles.triangle}
            style={{ transform: 'rotate(-90deg)' }}
          />
        </button>
      ) : null}
      {cameras
        ? Object.entries(cameras).map((stream) => {
            const key = stream.slice(0, -1)[0];
            const url = `ws://localhost:7000/ws/${stream.slice(0, -1)}`;
            return (
              <button
                key={`${key}-button`}
                id={`${key}-button`}
                onClick={() => handleSourceSwitch(url)}
                onMouseEnter={() => {
                  if (players && players[key]) {
                    players[key].play();
                  }
                }}
                onMouseLeave={() => {
                  if (players && players[key]) {
                    players[key].stop();
                  }
                }}
                type="button"
                style={{
                  width: '30%',
                }}
              >
                <canvas
                  id={`${key}-canv`}
                  aria-label={`Canvas for ${key}`}
                  style={{
                    width: '100%',
                    height: '180px',
                    overflow: 'hidden',
                  }}
                />
                {key}
              </button>
            );
          })
        : null}
      {cameras && Object.entries(cameras).length > numberOfShownMonitors ? (
        <button
          type="button"
          style={{ border: 'none', background: 'none', width: '4%' }}
          onClick={() =>
            setCurrentMonitor((prevCurrent) =>
              Math.max(
                0,
                Math.min(
                  prevCurrent + 1,
                  Object.entries(cameras).length - numberOfShownMonitors,
                ),
              ),
            )
          }
        >
          <div
            className={styles.triangle}
            style={{ transform: 'rotate(90deg)' }}
          />
        </button>
      ) : null}
    </div>
  );
}
