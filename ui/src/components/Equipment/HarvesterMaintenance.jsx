import React from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';

import { ActionGroup, ActionButton, ActionField } from './ActionGroup';
import InOutSwitch from '../InOutSwitch/InOutSwitch';

export default function HarvesterMaintenance(props) {
  const {
    contents,
    message,
    commands_state,
    currentPlateBarcode,
    global_state,
    calibratePin,
    validateCalibration,
    sendCommand,
    sendDCToCrims,
    commands,
  } = props;

  function renderActionButton(cmdInfo) {
    return (
      <ActionButton
        label={cmdInfo[1]}
        cmd={cmdInfo[0]}
        args={cmdInfo[3]}
        enabled={commands_state[cmdInfo[0]]}
        sendCommand={sendCommand}
        key={cmdInfo[1]}
      />
    );
  }

  function renderActionGroup(grpInfo) {
    const butGrp = [];

    for (const cmdInfo of grpInfo[1]) {
      butGrp.push(renderActionButton(cmdInfo));
    }

    return <ActionGroup name={grpInfo[0]} buttons={butGrp} />;
  }

  const groups = [];

  if (
    Object.keys(commands).length > 0 &&
    commands.cmds !== 'Harvester maintenance controller not defined'
  ) {
    for (const cmdgrp of commands.cmds) {
      groups.push(renderActionGroup(cmdgrp));
    }
  } else {
    return <div />;
  }

  const plateBarcode = global_state.plate_barecode?.toString();

  let calibrationState = false;
  if (contents) {
    calibrationState = contents.calibration_state;
  }

  return (
    <div>
      {groups}
      {message ? (
        <Card>
          <Card.Header>Status message</Card.Header>
          <Card.Body>
            <span className="scMessage">{message}</span>
          </Card.Body>
        </Card>
      ) : null}
      <ActionField
        btn_label="Set"
        label="Plate Barcode"
        cmd="loadPlateWithBarcode"
        args={currentPlateBarcode}
        sendCommand={sendCommand}
        global_state={global_state}
        header_msg="Actual Plate Barcode is"
        value={plateBarcode}
        inputType="text"
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
            onSave={(pkey, value) => sendCommand(pkey, value)}
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
                    onClick={() => calibratePin()}
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
                      onClick={() => validateCalibration(true)}
                      variant="outline-success"
                      style={{ marginRight: '2em' }}
                    >
                      Validate Calibration
                    </Button>
                  </Col>
                  <Col sm={6}>
                    <Button
                      className="mt-1"
                      onClick={() => validateCalibration(false)}
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
                  onClick={() => sendDCToCrims()}
                  title="TEST : Send latest Data collection Group and to Crims"
                >
                  Send Data to Crims
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
