import React from 'react';
import { Card } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import ActionField from './ActionField';
import ActionGroup from './ActionGroup';
import ActionButton from './ActionButton';

import { sendCommand } from '../../actions/sampleChanger';
import styles from './equipment.module.css';

function PlateManipulatorMaintenance() {
  const dispatch = useDispatch();

  const { commands, commands_state, message, global_state } = useSelector(
    (state) => state.sampleChangerMaintenance,
  );

  const commandGroups = commands.cmds || [];

  const scanLimits = global_state.scan_limits
    ? `[ ${global_state.scan_limits.toString().split(',').join(',   ')}]`
    : '';

  const plateBarcode = global_state.plate_info
    ? global_state.plate_info.plate_barcode.toString()
    : '';

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
        <Card className="mb-2">
          <Card.Header>Status message</Card.Header>
          <Card.Body>
            <span className={styles.scMessage}>{message}</span>
          </Card.Body>
        </Card>
      )}

      <ActionField
        headerMsg={`Omega Motor Dynamic ScanLimits Interval is : ${scanLimits}`}
        label="Desired Scan Speed"
        inputType="number"
        btnLabel="Get Scan Limits"
        onSubmit={(val) => {
          dispatch(sendCommand('getOmegaMotorDynamicScanLimits', val));
        }}
      />

      <ActionField
        headerMsg={`Actual Plate Barcode is : ${plateBarcode}`}
        label="Plate Barcode"
        btnLabel="Set Plate Barcode"
        onSubmit={(val) => {
          dispatch(sendCommand('setPlateBarcode', val));
        }}
      />
    </>
  );
}

export default PlateManipulatorMaintenance;
