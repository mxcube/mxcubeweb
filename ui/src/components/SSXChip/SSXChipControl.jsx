/* eslint-disable react/destructuring-assignment */
import 'fabric';
import './ssxchipcontrol.css';

import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { executeCommand, setAttribute } from '../../actions/beamline.js';
import { addShape } from '../../actions/sampleview.js';
import { showTaskForm } from '../../actions/taskForm.js';
import SSXChip from './SSXChip.jsx';

const SID = -1;

class SSXChipControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleAddTask = this.handleAddTask.bind(this);
    this.handleAddGrid = this.handleAddGrid.bind(this);
  }

  handleAddTask(triggerEvent) {
    const { currentSampleID, sampleList, defaultParameters, groupFolder } =
      this.props;

    const sampleData = sampleList[currentSampleID];

    this.props.showTaskForm(
      'Generic',
      [currentSampleID],
      {
        parameters: {
          ...defaultParameters.ssx_chip_collection.acq_parameters,
          name: 'SSX Collection',
          prefix: sampleData.defaultPrefix,
          subdir: `${groupFolder}${sampleData.defaultSubDir}`,
          cell_count: 0,
          numRows: 0,
          numCols: 0,
          selection: triggerEvent.props.selection,
        },
        type: 'ssx_chip_collection',
      },
      SID,
    );
  }

  handleAddGrid(data) {
    this.props.addShape({ t: 'G', ...data });
  }

  renderChip() {
    const { grids, hardwareObjects, uiproperties } = this.props;

    const headConfiguration =
      hardwareObjects.diffractometer.attributes.head_configuration ?? {};

    const chipLayoutList = headConfiguration.available;

    const sampleVerticalUiProp = uiproperties.components.find(
      (el) => el.role === 'sample_vertical',
    );

    const sampleHorizontalUiProp = uiproperties.components.find(
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
            gridList={Object.values(grids)}
            sampleMotorVerticalName={sampleVerticalUiProp.attribute}
            sampleMotorHorizontalName={sampleHorizontalUiProp.attribute}
            setAttribute={this.props.setAttribute}
            sendExecuteCommand={this.props.executeCommand}
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

function mapStateToProps(state) {
  return {
    sampleList: state.sampleGrid.sampleList,
    currentSampleID: state.queue.currentSampleID,
    defaultParameters: state.taskForm.defaultParameters,
    groupFolder: state.queue.groupFolder,
    hardwareObjects: state.beamline.hardwareObjects,
    uiproperties: state.uiproperties.sample_view_motors,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    addShape: bindActionCreators(addShape, dispatch),
    showTaskForm: bindActionCreators(showTaskForm, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    executeCommand: bindActionCreators(executeCommand, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SSXChipControl);
