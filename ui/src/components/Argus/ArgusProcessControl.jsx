import { useEffect, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { useDispatch } from 'react-redux';

import { executeCommand } from '../../actions/beamline';
import styles from './Argus.module.css';
import { capitalize } from './ArgusForm';

// helpful function to keep types in forms
function convertToType(previousValue, item) {
  if (Number.isInteger(previousValue)) {
    return Number.parseInt(item, 10);
  }
  if (
    !Number.isNaN(previousValue) &&
    Number.parseFloat(previousValue) === previousValue
  ) {
    return Number.parseFloat(item);
  }
  if (typeof previousValue === 'object') {
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } else {
    return item; // Keep it as a string by default
  }
}

export default function ArgusProcessControl(props) {
  const { state, type, hide } = props;
  const { show, title, settings } = state;
  const [formData, setFormData] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    if (type === 'start') {
      setFormData({ name: '' });
    } else if (type === 'settings') {
      const data = { ...settings };
      // prevent recording field, as it is read-only
      delete data.recording;
      setFormData(data);
    }
  }, [type, settings]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prevData) => {
      // keep the array structure if needed
      if (Array.isArray(prevData[name])) {
        return {
          ...prevData,
          [name]: value.split(',').map((item, index) => {
            return convertToType(prevData[name][index], item);
          }),
        };
      }
      return {
        ...prevData,
        [name]: value,
      };
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    const { name, ...args } = formData;

    if (type === 'start') {
      dispatch(
        executeCommand('argus', 'start_process', {
          name,
          process_type: title,
        }),
      );
    } else if (type === 'settings') {
      dispatch(
        executeCommand('argus', 'change_settings', {
          name: title,
          settings: args,
        }),
      );
    }

    hide();
  }

  return (
    <Modal id={`${type}-${title}`} show={show} onHide={hide}>
      <Modal.Header closeButton>
        <Modal.Title>{`${capitalize(type)}: ${capitalize(title)}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onSubmit}>
          <div className={styles.commandContainer}>
            {Object.keys(formData).map((key) => (
              <Form.Label key={`${key}-label`}>
                {capitalize(key)}:
                <Form.Control
                  label={capitalize(key)}
                  name={key}
                  type="text"
                  value={formData[key]}
                  onChange={handleChange}
                  required
                />
              </Form.Label>
            ))}
          </div>
          <div className={styles.settingsButtonsContainer}>
            {type === 'settings' ? (
              <Button
                onClick={() => {
                  dispatch(
                    executeCommand('argus', 'manage_process', {
                      name: title,
                      command: 'default_settings',
                    }),
                  );
                  hide();
                }}
              >
                Default Settings
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit">Submit</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
