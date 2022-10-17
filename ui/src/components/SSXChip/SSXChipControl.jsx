import React from 'react';
import 'fabric';
import {
  Button,
  OverlayTrigger,
  Popover,
} from 'react-bootstrap';
import './ssxchipcontrol.css';
import SSXChip from './SSXChip.jsx';

export default class SSXChipControl extends React.Component {
  constructor(props) {
    super(props);
    this.handleAddTask = this.handleAddTask.bind(this);
    this.handleAddGrid = this.handleAddGrid.bind(this);
    this.handleRemoveGrid = this.handleRemoveGrid.bind(this);
    this.handleUpdateGrid = this.handleUpdateGrid.bind(this);
  }

  handleAddTask(triggerEvent, event, props, data ) {
    const { sampleID, sampleData, defaultParameters } = this.props;
    const sid = -1;

    this.props.showForm(
      'Generic',
      [sampleID],
      {
        parameters: {
          ...defaultParameters.ssx_chip_collection.acq_parameters,
          name: "SSX Collection",
          prefix: sampleData.defaultPrefix,
          subdir: `${this.props.groupFolder}${sampleData.defaultSubDir}`,
          cell_count: 0,
          numRows: 0,
          numCols: 0,
          selection: triggerEvent.props.selection
        },
        type: "ssx_chip_collection"
      },
      sid
    );
  }

  handleAddGrid(data){
    this.props.sampleActions.sendAddShape({ t: 'G', ...data });
  }

  handleRemoveGrid(id) {

  }

  handleUpdateGrid(data) {
  
  }

  renderChip() {
    const headConfiguration = this.props.hardwareObjects.
      diffractometer.attributes.head_configuration ?? {};

    return (
      <Popover id="test">
        <Popover.Header>
          <b>Chip</b>
        </Popover.Header>
        <Popover.Body>
          <SSXChip
            headConfiguration={headConfiguration}
            onAddTask={this.handleAddTask}
            onAddGrid={this.handleAddGrid}
            onRemoveGrid={this.handleRemoveGrid}
            onUpdateGrid={this.handleUpdateGrid}
            gridList={Object.values(this.props.grids)}
          />
        </Popover.Body>
      </Popover>
    );
  }


  render() {
    return (
      <div style={{marginBottom: '1em'}}>
        <span className='chip-title'>Chip (Diamond Chip):</span>
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
