/* eslint-disable react/destructuring-assignment */
import 'fabric';
import './ssxchipcontrol.css';

import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';

import SSXChip from './SSXChip.jsx';

export default class SSXChipControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleAddTask = this.handleAddTask.bind(this);
    this.handleAddGrid = this.handleAddGrid.bind(this);
  }

  handleAddTask(triggerEvent) {
    const { currentSampleID, sampleData, defaultParameters } = this.props;
    const sid = -1;

    this.props.showForm(
      'Generic',
      [currentSampleID],
      {
        parameters: {
          ...defaultParameters.ssx_chip_collection.acq_parameters,
          name: 'SSX Collection',
          prefix: sampleData.defaultPrefix,
          subdir: `${this.props.groupFolder}${sampleData.defaultSubDir}`,
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

  handleAddGrid(data) {
    this.props.addShape({ t: 'G', ...data });
  }

  renderChip() {
    const headConfiguration =
      this.props.hardwareObjects.diffractometer.attributes.head_configuration ??
      {};

    const chipLayoutList = headConfiguration.available;

    const sampleVerticalUiProp = this.props.uiproperties.components.find(
      (el) => el.role === 'sample_vertical',
    );

    const sampleHorizontalUiProp = this.props.uiproperties.components.find(
      (el) => el.role === 'sample_horizontal',
    );

    return (
      <Popover id="test">
        <Popover.Header>
          <b>Chip</b>
        </Popover.Header>

        <Popover.Body>
          <SSXChip
            chipLayoutList={chipLayoutList}
            currentLayoutName={headConfiguration.current}
            availableChipLayoutList={Object.keys(headConfiguration.available)}
            onAddTask={this.handleAddTask}
            onAddGrid={this.handleAddGrid}
            gridList={Object.values(this.props.grids)}
            sampleMotorVerticalName={sampleVerticalUiProp.attribute}
            sampleMotorHorizontalName={sampleHorizontalUiProp.attribute}
            setAttribute={this.props.setAttribute}
            sendExecuteCommand={this.props.sendExecuteCommand}
          />
        </Popover.Body>
      </Popover>
    );
  }

  render() {
    return (
      <div style={{ marginBottom: '1em' }}>
        <span className="chip-title">Chip (Diamond Chip):</span>
        <OverlayTrigger
          trigger="click"
          rootClose
          placement="right"
          overlay={this.renderChip()}
        >
          <Button>
            <i className="fas fa-braille" /> Navigate
          </Button>
        </OverlayTrigger>
      </div>
    );
  }
}
