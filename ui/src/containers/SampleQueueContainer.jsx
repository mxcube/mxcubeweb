/* eslint-disable react/destructuring-assignment */
import React from 'react';
import { Nav, Stack } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { showDialog } from '../actions/general';
import { addTask } from '../actions/queue';
import { showList } from '../actions/queueGUI';
import { showTaskForm } from '../actions/taskForm';
import { showWorkflowParametersDialog } from '../actions/workflow';
import UserMessage from '../components/Notify/UserMessage';
import CurrentTree from '../components/SampleQueue/CurrentTree';
import QueueControl from '../components/SampleQueue/QueueControl';
import TodoTree from '../components/SampleQueue/TodoTree';
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

    return (
      <Stack className="flex-grow-1" gap={3}>
        <QueueControl />

        <div className={styles.queue}>
          <Nav
            className={styles.queueNav}
            variant="tabs"
            fill
            justify
            defaultActiveKey="current"
            activeKey={visibleList}
            onSelect={this.handleSelect}
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
          </Nav>

          <div className={styles.queueBody}>
            {loading && (
              <div className={styles.loader} style={{ zIndex: '1000' }}>
                <img src={loader} className="img-fluid" width="100" alt="" />
              </div>
            )}
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
          </div>
        </div>

        <div className={styles.logs}>
          <div className={styles.logsHeader}>
            <span className="fas fa-md fa-info-circle me-2" />
            Log messages
          </div>
          <div className={styles.logsBody}>
            <UserMessage />
          </div>
        </div>
      </Stack>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchString: state.queueGUI.searchString,
    currentSampleID: state.queue.currentSampleID,
    visibleList: state.queueGUI.visibleList,
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
    addTask: bindActionCreators(addTask, dispatch),

    // Workflow action
    showWorkflowParametersDialog: bindActionCreators(
      showWorkflowParametersDialog,
      dispatch,
    ),

    showList: bindActionCreators(showList, dispatch),

    showForm: bindActionCreators(showTaskForm, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SampleQueueContainer);
