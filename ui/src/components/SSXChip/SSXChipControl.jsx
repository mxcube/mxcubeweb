import 'fabric';
import './ssxchipcontrol.css';

import React from 'react';

import SSXChip from './SSXChip.jsx';

export default function SSXChipControl(props) {
  function handleAddTask(triggerEvent) {
    const { currentSampleID, sampleData, defaultParameters } = props;
    const sid = -1;

    props.showForm(
      'Generic',
      [currentSampleID],
      {
        parameters: {
          ...defaultParameters.ssx_chip_collection.acq_parameters,
          name: 'SSX Collection',
          prefix: sampleData.defaultPrefix,
          subdir: `${props.groupFolder}${sampleData.defaultSubDir}`,
          cell_count: 0,
          numRows: 0,
          numCols: 0,
          selection: triggerEvent.props.selection,
        },
        type: 'ssx_chip_collection',
      },
      sid,
    );
  }

  function handleAddGrid(data) {
    props.sampleViewActions.addShape({ t: 'G', ...data });
  }

  if (!props.show) {
    return <div />;
  }

  const headConfiguration =
    props.hardwareObjects.diffractometer.attributes.head_configuration ?? {};

  const chipLayoutList = headConfiguration.available;

  const sampleVerticalUiProp = props.uiproperties.components.find(
    (el) => el.role === 'sample_vertical',
  );

  const sampleHorizontalUiProp = props.uiproperties.components.find(
    (el) => el.role === 'sample_horizontal',
  );

  const focus = props.uiproperties.components.find((el) => el.role === 'focus');

  const sampleMotorVertical =
    props.hardwareObjects[sampleVerticalUiProp.attribute];
  const sampleMotorHorizontal =
    props.hardwareObjects[sampleHorizontalUiProp.attribute];
  const focusMotor = props.hardwareObjects[focus.attribute];

  return (
    <SSXChip
      chipLayoutList={chipLayoutList}
      currentLayoutName={headConfiguration.current}
      availableChipLayoutList={Object.keys(headConfiguration.available)}
      onAddTask={handleAddTask}
      onAddGrid={handleAddGrid}
      gridList={Object.values(props.grids)}
      sampleMotorVertical={sampleMotorVertical}
      sampleMotorHorizontal={sampleMotorHorizontal}
      focusMotor={focusMotor}
      setAttribute={props.setAttribute}
      sendExecuteCommand={props.sendExecuteCommand}
    />
  );
}
