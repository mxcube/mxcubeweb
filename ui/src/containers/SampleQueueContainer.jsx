/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Nav } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { executeCommand, setAttribute } from '../actions/beamline';
import { showDialog } from '../actions/general';
import { addTask } from '../actions/queue';
import { showList } from '../actions/queueGUI';
import * as sampleViewActions from '../actions/sampleview'; // eslint-disable-line import/no-namespace
import { showTaskForm } from '../actions/taskForm';
import { showWorkflowParametersDialog } from '../actions/workflow';
import UserMessage from '../components/Notify/UserMessage';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import TodoTree from '../components/SampleQueue/TodoTree';
import SSXChipControl from '../components/SSXChip/SSXChipControl';
import loader from '../img/loader.gif';
import styles from './SampleQueueContainer.module.css';

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

    const grids = {};
    const selectedGrids = [];

    if (this.props.shapes !== undefined) {
      Object.keys(this.props.shapes).forEach((key) => {
        const shape = this.props.shapes[key];
        switch (shape.t) {
          case 'G': {
            grids[shape.id] = shape;

            if (shape.selected) {
              selectedGrids.push(shape);
            }

            break;
          }
          // No default
        }
      });
    }

    return (
      <div className={styles.container}>
        <QueueControl />
        <div className={styles.queueBody}>
          <Nav
            variant="tabs"
            fill
            justify
            defaultActiveKey="current"
            activeKey={visibleList}
            onSelect={this.handleSelect}
            className={styles.queueNav}
          >
            <Nav.Item>
              <Nav.Link eventKey="current" className={styles.queueNavLink}>
                <b>
                  {currentSampleID
                    ? `Sample: ${proteinAcronym} ${sampleName}`
                    : 'Current'}
                </b>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="todo" className={styles.queueNavLink}>
                <b>Queued Samples ({todo.length})</b>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="chip" className="queue-nav-link">
                <i className="fas fa-braille" /> &nbsp; <b>Chip callibration</b>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          {loading ? (
            <div className={styles.centerInBox} style={{ zIndex: '1000' }}>
              <img src={loader} className="img-fluid" width="100" alt="" />
            </div>
          ) : null}
          <CurrentTree
            show={visibleList === 'current'}
            mounted={currentSampleID}
            sampleList={sampleList}
            checked={checked}
            showForm={showForm}
            displayData={displayData}
            addTask={this.props.addTask}
            plotsData={this.props.plotsData}
            plotsInfo={this.props.plotsInfo}
            shapes={this.props.shapes}
            showDialog={this.props.showDialog}
            showWorkflowParametersDialog={
              this.props.showWorkflowParametersDialog
            }
          />
          {visibleList === 'todo' && <TodoTree list={todo} />}
          <SSXChipControl
            show={visibleList === 'chip'}
            showForm={showForm}
            currentSampleID={this.props.currentSampleID}
            sampleData={this.props.sampleList[currentSampleID]}
            defaultParameters={this.props.defaultParameters}
            groupFolder={this.props.groupFolder}
            hardwareObjects={this.props.hardwareObjects}
            uiproperties={this.props.uiproperties.sample_view_motors}
            sampleViewActions={this.props.sampleViewActions}
            grids={grids}
            selectedGrids={selectedGrids}
            setAttribute={this.props.setAttribute}
            sendExecuteCommand={this.props.sendExecuteCommand}
          />
          {visibleList !== 'chip' && (
            <div className={styles.queueMessages}>
              <div className={styles.queueMessagesTitle}>
                <span
                  style={{ marginRight: '7px' }}
                  className="fas fa-lg fa-info-circle"
                />
                Log messages:
              </div>
              <div className={styles.queueMessagesBody}>
                <UserMessage />
              </div>
            </div>
          )}
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
    queue: state.queue.queue,
    groupFolder: state.queue.groupFolder,
    hardwareObjects: state.beamline.hardwareObjects,
    uiproperties: state.uiproperties,
    sampleList: state.sampleGrid.sampleList,
    sampleOrder: state.sampleGrid.order,
    checked: state.queue.checked,
    displayData: state.queueGUI.displayData,
    loading: state.queueGUI.loading,
    plotsData: state.beamline.plotsData,
    plotsInfo: state.beamline.plotsInfo,
    selectedShapes: state.sampleview.selectedShapes,
    shapes: state.shapes,
    defaultParameters: state.taskForm.defaultParameters,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    // Queue actions
    addTask: bindActionCreators(addTask, dispatch),

    // Workflow action
    showWorkflowParametersDialog: bindActionCreators(
      showWorkflowParametersDialog,
      dispatch,
    ),

    showList: bindActionCreators(showList, dispatch),

    showForm: bindActionCreators(showTaskForm, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
    sampleViewActions: bindActionCreators(sampleViewActions, dispatch),
    setAttribute: bindActionCreators(setAttribute, dispatch),
    sendExecuteCommand: bindActionCreators(executeCommand, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleQueueContainer);
