import { Dropdown, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import {
  setAutoAddDiffPlan,
  setAutoMountSample,
  setCentringMethod,
  setQueueSettings,
} from '../actions/queue';
import { AUTO_LOOP_CENTRING, CLICK_CENTRING } from '../constants';
import GroupFolderInput from './GroupFolderInput.jsx';
import NumSnapshotsDropDown from './NumSnapshotsDropDown.jsx';
import styles from './QueueSettings.module.css';

export default function QueueSettings() {
  const dispatch = useDispatch();
  const queueState = useSelector((state) => state.queue);

  return (
    <Dropdown autoClose="outside">
      <Dropdown.Toggle variant="outline-secondary">
        <span>
          <i className="fas fa-1x fa-cog" /> Settings
        </span>
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.dropdownMenu}>
        <Dropdown.Item>
          <Form.Check
            type="checkbox"
            name="autoMountNext"
            onChange={(e) => dispatch(setAutoMountSample(e.target.checked))}
            checked={queueState.autoMountNext}
            label="Automount next sample"
            id="auto-mount-next"
          />
        </Dropdown.Item>
        <Dropdown.Item>
          <Form.Check
            type="checkbox"
            onChange={(e) => {
              dispatch(
                setCentringMethod(
                  e.target.checked ? AUTO_LOOP_CENTRING : CLICK_CENTRING,
                ),
              );
            }}
            name="autoLoopCentring"
            checked={queueState.centringMethod === AUTO_LOOP_CENTRING}
            label="Auto loop centring"
            id="auto-loop-centring"
          />
        </Dropdown.Item>
        <Dropdown.Item>
          <Form.Check
            type="checkbox"
            name="autoAddDiffPlan"
            onChange={(e) => dispatch(setAutoAddDiffPlan(e.target.checked))}
            checked={queueState.autoAddDiffplan}
            label="Auto add diffraction plan"
            id="auto-add-diff-plan"
          />
        </Dropdown.Item>
        <Dropdown.Item>
          <Form.Check
            type="checkbox"
            name="rememberParametersBetweenSamples"
            onChange={(e) => {
              dispatch(
                setQueueSettings(
                  'rememberParametersBetweenSamples',
                  e.target.checked,
                ),
              );
            }}
            checked={queueState.rememberParametersBetweenSamples}
            label="Remember parameters between samples"
            id="remember-params"
          />
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item>
          <NumSnapshotsDropDown align="end" />
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item>
          <GroupFolderInput />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
