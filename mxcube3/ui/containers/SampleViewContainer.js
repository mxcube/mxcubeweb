import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SampleImage from '../components/SampleView/SampleImage';
import MotorControl from '../components/SampleView/MotorControl';
import ContextMenu from '../components/SampleView/ContextMenu';
import * as SampleViewActions from '../actions/sampleview';
import { showTaskForm } from '../actions/taskForm';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import SampleQueueContainer from './SampleQueueContainer';

class SampleViewContainer extends Component {

  render() {
    const { imageRatio, motorSteps } = this.props.sampleViewState;
    const { sendMotorPosition, setStepSize, sendStopMotor } = this.props.sampleViewActions;
    const sampleID = this.props.current.sampleID;
    const [points, lines, grids] = [{}, {}, {}];

    Object.keys(this.props.shapes).forEach((key) => {
      const shape = this.props.shapes[key];
      if (shape.t === 'P') {
        points[shape.id] = shape;
      } else if (shape.t === 'L') {
        lines[shape.id] = shape;
      } else if (shape.t === 'G') {
        grids[shape.id] = shape;
      }
    });

    return (
        <div className="row">
        <div className="col-xs-12">
            <div className="row">
              <div className="col-xs-12">
                <BeamlineSetupContainer />
              </div>
            </div>
            <div className="row" style={ { display: 'flex', marginTop: '1em' } }>
              <div className="col-xs-1"
                style={ { paddingRight: '5px', paddingLeft: '1.5em' } }
              >
                <MotorControl
                  save={sendMotorPosition}
                  saveStep={setStepSize}
                  motors={this.props.beamline.motors}
                  steps={motorSteps}
                  stop={sendStopMotor}
                />
                </div>
              <div className="col-xs-7">
                <ContextMenu
                  {...this.props.contextMenu}
                  sampleActions={this.props.sampleViewActions}
                  showForm={this.props.showForm}
                  sampleID={sampleID}
                  sampleData={this.props.sampleList[sampleID]}
                  defaultParameters={this.props.defaultParameters}
                  imageRatio={imageRatio}
                  workflows={this.props.workflows}
                />
                <SampleImage
                  sampleActions={this.props.sampleViewActions}
                  {...this.props.sampleViewState}
                  {...this.props.beamline}
                  contextMenuVisible={this.props.contextMenu.show}
                  points={points}
                  lines={lines}
                  grids={grids}
                  cellCounting={this.props.cellCounting}
                />
              </div>
              <div className="col-xs-3" style={ { display: 'flex' } }>
                <SampleQueueContainer />
            </div>
            </div>
        </div>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    sampleList: state.sampleGrid.sampleList,
    current: state.queue.current,
    sampleViewState: state.sampleview,
    contextMenu: state.contextMenu,
    beamline: state.beamline,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    workflows: state.workflow.workflows,
    cellCounting: state.taskForm.defaultParameters.mesh.cell_counting
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sampleViewActions: bindActionCreators(SampleViewActions, dispatch),
    showForm: bindActionCreators(showTaskForm, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer);
