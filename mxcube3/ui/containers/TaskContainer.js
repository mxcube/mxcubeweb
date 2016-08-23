import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Characterisation from '../components/Tasks/Characterisation';
import DataCollection from '../components/Tasks/DataCollection';
import AddSample from '../components/Tasks/AddSample';
import { hideTaskParametersForm, showTaskForm } from '../actions/taskForm';
import { sendCurrentPhase } from '../actions/sampleview';


import {
  addSampleAndTask,
  addTask,
  updateTask,
  addSample,
  appendSampleList,
  setQueueAndRun,
} from '../actions/queue';


class TaskContainer extends React.Component {
  constructor(props) {
    super(props);
    this.addSample = this.addSample.bind(this);
  }

  addSample(sampleID, parameters) {
    this.props.appendSampleList(sampleID, parameters);
    this.props.addSample(sampleID, parameters);
  }

  render() {
    return (
      <div className="col-xs-12">
        <Characterisation
          pointId={this.props.pointId}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          addSampleAndTask={this.props.addSampleAndTask}
          changeTask={this.props.changeTask}
          addTask={this.props.addTask}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'Characterisation'}
          rootPath={this.props.path}
          queue={this.props.queue}
          sampleList={this.props.sampleList}
          setQueueAndRun={this.props.setQueueAndRun}
        />

        <DataCollection
          pointId={this.props.pointId}
          sampleIds={this.props.sampleIds}
          taskData={this.props.taskData}
          addSampleAndTask={this.props.addSampleAndTask}
          changeTask={this.props.changeTask}
          addTask={this.props.addTask}
          hide={this.props.hideTaskParametersForm}
          apertureList={this.props.apertureList}
          show={this.props.showForm === 'DataCollection'}
          rootPath={this.props.path}
          queue={this.props.queue}
          sampleList={this.props.sampleList}
          setQueueAndRun={this.props.setQueueAndRun}
        />

        <AddSample
          hide={this.props.hideTaskParametersForm}
          show={this.props.showForm === 'AddSample'}
          add={this.addSample}
          id={this.props.manualMountID}
          phase={this.props.currentPhase}
          setPhase={this.props.sendCurrentPhase}
        />
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    queue: state.queue.queue,
    sampleList: state.queue.sampleList,
    showForm: state.taskForm.showForm,
    taskData: state.taskForm.taskData,
    sampleIds: state.taskForm.sampleIds,
    pointId: state.taskForm.pointId,
    defaultParameters: state.taskForm.defaultParameters,
    manualMountID: state.queue.manualMount.id,
    currentPhase: state.sampleview.currentPhase,
    apertureList: state.sampleview.apertureList,
    path: state.queue.rootPath
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    hideTaskParametersForm: bindActionCreators(hideTaskParametersForm, dispatch),
    addSampleAndTask: bindActionCreators(addSampleAndTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    setQueueAndRun: bindActionCreators(setQueueAndRun, dispatch),
    appendSampleList: bindActionCreators(appendSampleList, dispatch),
    changeTask: bindActionCreators(updateTask, dispatch),
    addSample: bindActionCreators(addSample, dispatch),
    sendCurrentPhase: bindActionCreators(sendCurrentPhase, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskContainer);

