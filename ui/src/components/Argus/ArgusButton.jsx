import { useState } from 'react';
import { useSelector } from 'react-redux';

import styles from './Argus.module.css';
import ArgusForm from './ArgusForm';
import Eye from './Eye';

export default function ArgusButton(props) {
  const { onClick } = props;
  const [showForm, setShowForm] = useState(false);
  const argus = useSelector(
    (state) => state.beamline.hardwareObjects.argus || null,
  );

  // Early return if object is not defined
  if (!argus) {
    return null;
  }
  const { processes_info } = argus.attributes;
  const recording =
    processes_info?.running?.Recorder?.settings?.recording || false;
  const running = processes_info?.closable_running || false;

  function handleButtonClick() {
    onClick();
    setShowForm((prev) => !prev);
  }

  return (
    <div>
      <button
        className={styles.argusButton}
        type="button"
        onClick={handleButtonClick}
      >
        <div className={`${styles.eyeContainer} me-2`}>
          {running || recording ? (
            <Eye recording={recording} />
          ) : (
            <span className="fas fa-solid fa-eye-slash" />
          )}
        </div>
        Argus
      </button>
      {showForm && (
        <ArgusForm
          handleHide={() => {
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
