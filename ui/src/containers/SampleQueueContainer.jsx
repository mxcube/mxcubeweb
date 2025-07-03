/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Nav } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { prepareBeamlineForNewSample } from '../actions/beamline';
import { showDialog } from '../actions/general';
import {
  addTask,
  changeTaskOrderAction,
  deleteTask,
  moveTask,
  toggleCheckBox,
} from '../actions/queue';
import { collapseItem, selectItem, showList } from '../actions/queueGUI';
import { showTaskForm } from '../actions/taskForm';
import { showWorkflowParametersDialog } from '../actions/workflow';
import UserMessage from '../components/Notify/UserMessage';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import TodoTree from '../components/SampleQueue/TodoTree';
import loader from '../img/loader.gif';

class SampleQueueContainer extends React.Component {
  constructor(props) {
    super(props);
    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(selectedKey) {
    this.props.showList(selectedKey);
  }

  render() {
    const {
      checked,
      currentSampleID,
      sampleOrder,
      queue,
      sampleList,
      showForm,
      queueStatus,
      displayData,
      visibleList,
      loading,
    } = this.props;

    // go through the queue, check if sample has been collected or not
    // to make todo lists
    const todo = [];

    for (const key of sampleOrder) {
      if (queue.includes(key)) {
        const sample = sampleList[key];

        if (sample.sampleID !== currentSampleID && sample.checked) {
          todo.push(sample.sampleID);
        }
      }
    }

    let sampleName = '';
    let proteinAcronym = '';

    if (currentSampleID) {
      const sampleData = sampleList[currentSampleID] || {};
      sampleName = sampleData.sampleName || '';
      proteinAcronym = sampleData.proteinAcronym
        ? `${sampleData.proteinAcronym} -`
        : '';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <QueueControl />
        <div className="m-tree queue-body">
          <Nav
            variant="tabs"
            fill
            justify
            defaultActiveKey="current"
            activeKey={visibleList}
            onSelect={this.handleSelect}
            className="queue-nav"
          >
            <Nav.Item>
              <Nav.Link eventKey="current" className="queue-nav-link">
                <b>
                  {currentSampleID
                    ? `Sample: ${proteinAcronym} ${sampleName}`
                    : 'Current'}
                </b>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="todo" className="queue-nav-link">
                <b>Queued Samples ({todo.length})</b>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          {loading ? (
            <div className="center-in-box" style={{ zIndex: '1000' }}>
              <img src={loader} className="img-responsive" width="100" alt="" />
            </div>
          ) : null}
          <CurrentTree
            changeOrder={this.props.changeTaskOrderAction}
            show={visibleList === 'current'}
            mounted={currentSampleID}
            sampleList={sampleList}
            toggleCheckBox={this.props.toggleCheckBox}
            checked={checked}
            deleteTask={this.props.deleteTask}
            showForm={showForm}
            collapseItem={this.props.collapseItem}
            selectItem={this.props.selectItem}
            displayData={displayData}
            moveTask={this.props.moveTask}
            addTask={this.props.addTask}
            plotsData={this.props.plotsData}
            plotsInfo={this.props.plotsInfo}
            shapes={this.props.shapes}
            showDialog={this.props.showDialog}
            showWorkflowParametersDialog={
              this.props.showWorkflowParametersDialog
            }
          />
          <TodoTree
            show={visibleList === 'todo'}
            list={todo}
            sampleList={sampleList}
            showForm={showForm}
            queueStatus={queueStatus}
            prepareBeamlineForNewSample={this.props.prepareBeamlineForNewSample}
          />
          <div className="queue-messages">
            <div className="queue-messages-title">
              <span
                style={{ marginRight: '7px' }}
                className="fas fa-lg fa-info-circle"
              />
              Log messages:
            </div>
            <div className="queue-messages-body">
              <UserMessage />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchString: state.queueGUI.searchString,
    currentSampleID: state.queue.currentSampleID,
    visibleList: state.queueGUI.visibleList,
    queueStatus: state.queue.queueStatus,
    queue: state.queue.queue,
    sampleList: state.sampleGrid.sampleList,
    sampleOrder: state.sampleGrid.order,
    checked: state.queue.checked,
    displayData: state.queueGUI.displayData,
    loading: state.queueGUI.loading,
    plotsData: state.beamline.plotsData,
    plotsInfo: state.beamline.plotsInfo,
    selectedShapes: state.sampleview.selectedShapes,
    shapes: state.shapes,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    // Queue actions
    toggleCheckBox: bindActionCreators(toggleCheckBox, dispatch),
    changeTaskOrderAction: bindActionCreators(changeTaskOrderAction, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    addTask: bindActionCreators(addTask, dispatch),
    moveTask: bindActionCreators(moveTask, dispatch),

    // Workflow action
    showWorkflowParametersDialog: bindActionCreators(
      showWorkflowParametersDialog,
      dispatch,
    ),

    // Queue GUI actions
    collapseItem: bindActionCreators(collapseItem, dispatch),
    selectItem: bindActionCreators(selectItem, dispatch),
    showList: bindActionCreators(showList, dispatch),

    showForm: bindActionCreators(showTaskForm, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
    prepareBeamlineForNewSample: bindActionCreators(
      prepareBeamlineForNewSample,
      dispatch,
    ),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleQueueContainer);
