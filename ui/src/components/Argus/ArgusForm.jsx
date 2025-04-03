import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { executeCommand } from '../../actions/beamline';
import styles from './Argus.module.css';
import ArgusProcessControl from './ArgusProcessControl';

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function ArgusForm(props) {
  const { handleHide } = props;

  const argus = useSelector(
    (state) => state.beamline.hardwareObjects.argus || null,
  );

  const dispatch = useDispatch();

  const [startState, setStartState] = useState({
    show: false,
    title: 'Default',
  });

  const [settingsState, setSettingsState] = useState({
    show: false,
    title: 'Default',
    settings: {},
  });

  if (!argus) {
    return null;
  }

  function showStart(title) {
    setStartState((prevState) => ({
      ...prevState,
      show: true,
      title,
    }));
  }

  function showSettingsState(title, settings) {
    setSettingsState((prevState) => ({
      ...prevState,
      show: true,
      title,
      settings,
    }));
  }

  function hideChildren() {
    setStartState((prevState) => ({
      ...prevState,
      show: false,
    }));
    setSettingsState((prevState) => ({
      ...prevState,
      show: false,
    }));
  }

  if (!argus?.attributes) {
    return null;
  }

  const { processes_info, last_response } = argus.attributes;
  if (!last_response || !processes_info) {
    return null;
  }
  const { status, error_message } = last_response;
  const capitalizedStatus = status ? `${capitalize(status)} !` : '';

  return (
    <div>
      <ArgusProcessControl
        state={startState}
        type="start"
        hide={hideChildren}
      />
      <ArgusProcessControl
        state={settingsState}
        type="settings"
        hide={hideChildren}
      />
      <Modal
        id="ArgusModal"
        show={!startState.show && !settingsState.show}
        onHide={handleHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>Argus Processes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {Object.keys(processes_info.running).map((key) => (
            <div className={styles.processContainer} key={`${key}-process`}>
              <span>
                {key}
                {` (${processes_info.running[key].type})`}
              </span>
              {key === 'Error' ? (
                <div />
              ) : (
                <div className={styles.processButtons}>
                  {Object.values(processes_info.running[key].commands).map(
                    (element) => {
                      if (key === 'Recorder') {
                        const { recording } =
                          processes_info.running[key].settings;
                        if (
                          (element === 'start' && recording) ||
                          (element === 'stop' && !recording)
                        ) {
                          return null;
                        }
                      }
                      return (
                        <Button
                          key={`${key}-command-${element}`}
                          variant="primary"
                          onClick={() =>
                            dispatch(
                              executeCommand('argus', 'manage_process', {
                                name: key,
                                command: element,
                              }),
                            )
                          }
                        >
                          {capitalize(element)}
                        </Button>
                      );
                    },
                  )}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      showSettingsState(
                        key,
                        processes_info.running[key].settings,
                      )
                    }
                  >
                    <i className="fa fa-cog" />
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      dispatch(
                        executeCommand('argus', 'stop_process', { name: key }),
                      )
                    }
                  >
                    X
                  </Button>
                </div>
              )}
            </div>
          ))}
          <hr />
          {Object.keys(processes_info.available).length === 0 ? (
            <span>No available processes</span>
          ) : (
            <div className={styles.typesContainer}>
              {Object.values(processes_info.available).map((type) => (
                <Button
                  className={styles.typeButton}
                  variant="outlined"
                  key={`${type}-typeButton`}
                  onClick={() => showStart(type)}
                >
                  {capitalize(type)}
                </Button>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {last_response ? (
            <div>
              <span style={{ color: status === 'success' ? 'green' : 'red' }}>
                {capitalizedStatus}
              </span>
              <span>{error_message}</span>
            </div>
          ) : (
            <div />
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
