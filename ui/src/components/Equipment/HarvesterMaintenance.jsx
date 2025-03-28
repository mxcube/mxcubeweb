import { Row, Col, Button, Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import ActionGroup from './ActionGroup';
import ActionButton from './ActionButton';
import ActionField from './ActionField';
import InOutSwitch from '../InOutSwitch/InOutSwitch';

import {
  calibratePin,
  sendCommand,
  sendDataCollectionToCrims,
  validateCalibration,
} from '../../actions/harvester';
import styles from './equipment.module.css';

export default function HarvesterMaintenance() {
  const dispatch = useDispatch();

  const contents = useSelector((state) => state.harvester.contents);
  const { commands, commands_state, global_state, message } = useSelector(
    (state) => state.harvesterMaintenance,
  );

  const commandGroups = commands.cmds || [];
  const plateBarcode = global_state.plate_barecode?.toString();
  const calibrationState = contents ? contents.calibration_state : false;

  return (
    <>
      {commandGroups.map(([grpLabel, grpCmds]) => (
        <ActionGroup key={grpLabel} label={grpLabel}>
          {grpCmds.map(([cmd, cmdLabel, , cmdArgs]) => (
            <ActionButton
              key={cmd}
              label={cmdLabel}
              disabled={!commands_state[cmd]}
              onSend={() => dispatch(sendCommand(cmd, cmdArgs))}
            />
          ))}
        </ActionGroup>
      ))}

      {message && (
        <Card>
          <Card.Header>Status message</Card.Header>
          <Card.Body>
            <span className={styles.scMessage}>{message}</span>
          </Card.Body>
        </Card>
      )}

      <ActionField
        headerMsg={`Actual Plate Barcode is : ${plateBarcode}`}
        label="Plate Barcode"
        btnLabel="Set"
        onSubmit={(val) => {
          dispatch(sendCommand('loadPlateWithBarcode', val));
        }}
      />

      <Card className="mb-2">
        <Card.Header>Temperature Mode</Card.Header>
        <Card.Body>
          <InOutSwitch
            labelText="Mode :"
            openText="Room Temperature"
            offText="Cryo Temperature"
            overlayPlacement="right"
            state={
              contents.room_temperature_mode
                ? 'Room Temperature'
                : 'Cryo Temperature'
            }
            openValue
            isBtnLabel
            offValue={false}
            value={contents.room_temperature_mode}
            pkey="set_room_temperature_mode"
            onSave={(pkey, value) => dispatch(sendCommand(pkey, value))}
          />
        </Card.Body>
      </Card>

      <div>
        <Card className="mb-2">
          <Card.Header> Procedure </Card.Header>
          <Card.Body>
            <Row>
              {!calibrationState ? (
                <Col sm={6}>
                  <Button
                    className="mt-1"
                    variant="outline-secondary"
                    onClick={() => dispatch(calibratePin())}
                  >
                    Calibrate
                  </Button>
                </Col>
              ) : (
                <>
                  <Col sm={12}>
                    <h5>
                      Please align the tip of the pin with the center of the
                      beam
                    </h5>
                  </Col>
                  <Col sm={6}>
                    <Button
                      className="mt-1 text-nowrap"
                      onClick={() => dispatch(validateCalibration(true))}
                      variant="outline-success"
                      style={{ marginRight: '2em' }}
                    >
                      Validate Calibration
                    </Button>
                  </Col>
                  <Col sm={6}>
                    <Button
                      className="mt-1"
                      onClick={() => dispatch(validateCalibration(false))}
                      variant="outline-warning"
                    >
                      Cancel Calibration
                    </Button>
                  </Col>
                </>
              )}
            </Row>
            <hr />
            <Row className="mt-2">
              <Col sm={6}>
                <Button
                  className="mt-1"
                  variant="outline-secondary"
                  onClick={() => dispatch(sendDataCollectionToCrims())}
                  title="TEST : Send latest Data collection Group and to Crims"
                >
                  Send Data to Crims
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
