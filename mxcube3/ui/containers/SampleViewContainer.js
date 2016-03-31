import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleImage from '../components/SampleView/SampleImage'
import MotorControl from '../components/SampleView/MotorControl'
import ShapeList from '../components/SampleView/ShapeList'
import ContextMenu from '../components/SampleView/ContextMenu'
import SampleControls from '../components/SampleView/SampleControls'
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import * as SampleViewActions from '../actions/sampleview'
import { showTaskParametersForm } from '../actions/taskForm'

class SampleViewContainer extends Component {

  render() {

    const {show, shape, x, y} = this.props.sampleViewState.contextMenu;
    const {width, height, points, clickCentring, pixelsPerMm, imageRatio, canvas } = this.props.sampleViewState
    const sampleId = this.props.lookup[this.props.current.node];

    return (
      <div className="row">
        <ContextMenu show={show} shape={shape} x={x} y={y} sampleActions={this.props.sampleViewActions} showForm={this.props.showForm} sampleId={sampleId} defaultParameters={this.props.defaultParameters}/>
        <div className="col-xs-8">
            <SampleImage 
                sampleActions={this.props.sampleViewActions} 
                imageHeight={height} 
                imageWidth={width}
                pixelsPerMm={pixelsPerMm} 
                shapeList={points} 
                clickCentring={clickCentring} 
                mounted={this.props.current.node}
                contextMenuShow={show}
                imageRatio={imageRatio}
                canvas={canvas} 
            />
            <SampleControls sampleActions={this.props.sampleViewActions} sampleViewState={this.props.sampleViewState} canvas={canvas} />
        </div>
        <div className="col-xs-4">
            <MotorControl sampleActions={this.props.sampleViewActions} motors={this.props.sampleViewState.motors}/>
            <ShapeList sampleViewState={this.props.sampleViewState} />
        </div>
      </div>
    )
  }
}


function mapStateToProps(state) {
  return { 
          current : state.queue.current,
          sampleInformation: state.samples_grid.samples_list,
          sampleViewState: state.sampleview,
          lookup: state.queue.lookup,
          defaultParameters: state.taskForm.defaultParameters
    }
}

function mapDispatchToProps(dispatch) {
 return  {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    sampleViewActions : bindActionCreators(SampleViewActions, dispatch),
    showForm : bindActionCreators(showTaskParametersForm, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer)