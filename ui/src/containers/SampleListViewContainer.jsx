/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import withRouter from '../components/WithRouter';
import loader from '../img/loader.gif';

import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  SplitButton,
  DropdownButton,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';

import { MdGridView } from 'react-icons/md';

import { QUEUE_RUNNING } from '../constants';

import {
  sendGetSampleList,
  setViewModeAction,
  sendSyncSamples,
  syncWithCrims,
  filterAction,
  selectSamplesAction,
  showGenericContextMenu,
} from '../actions/sampleGrid';

import {
  sendClearQueue,
  deleteSamplesFromQueue,
  setEnabledSample,
  addSamplesToQueue,
  sendStopQueue,
  deleteTask,
  deleteTaskList,
} from '../actions/queue';

import { showConfirmCollectDialog } from '../actions/queueGUI';
import { showConfirmClearQueueDialog } from '../actions/general';

import { showTaskForm } from '../actions/taskForm';

import SampleGridTableContainer from './SampleGridTableContainer';

import ConfirmActionDialog from '../components/GenericDialog/ConfirmActionDialog';
import QueueSettings from './QueueSettings.jsx';

import '../components/SampleGrid/SampleGridTable.css';

class SampleListViewContainer extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.syncSamples = this.syncSamples.bind(this);
    this.sampleGridFilter = this.sampleGridFilter.bind(this);
    this.getFilterOptionValue = this.getFilterOptionValue.bind(this);
    this.sampleGridClearFilter = this.sampleGridClearFilter.bind(this);
    this.filterIsUsed = this.filterIsUsed.bind(this);
    this.getCellFilterOptions = this.getCellFilterOptions.bind(this);

    // Methods for handling addition and removal of queue items (Samples and Tasks)
    // Also used by the SampleGridContainer
    this.setViewMode = this.setViewMode.bind(this);
    this.addSelectedSamplesToQueue = this.addSelectedSamplesToQueue.bind(this);
    this.selectAllSamples = this.selectAllSamples.bind(this);
    this.clearSelectedSamples = this.clearSelectedSamples.bind(this);
    this.showCharacterisationForm = this.showTaskForm.bind(
      this,
      'Characterisation',
      {},
    );
    this.showDataCollectionForm = this.showTaskForm.bind(
      this,
      'DataCollection',
      {},
    );
    this.showWorkflowForm = this.showTaskForm.bind(this, 'Workflow');
    this.showAddSampleForm = this.showTaskForm.bind(this, 'AddSample');
    this.inQueue = this.inQueue.bind(this);
    this.inQueueDeleteElseAddSamples =
      this.inQueueDeleteElseAddSamples.bind(this);
    this.addSamplesToQueue = this.addSamplesToQueue.bind(this);
    this.removeSamplesFromQueue = this.removeSamplesFromQueue.bind(this);
    this.removeSelectedSamples = this.removeSelectedSamples.bind(this);
    this.removeSelectedTasks = this.removeSelectedTasks.bind(this);

    this.collectButton = this.collectButton.bind(this);
    this.startCollect = this.startCollect.bind(this);
  }

  componentDidMount() {
    const localStorageViewMode = localStorage.getItem('view-mode');
    this.setViewMode(localStorageViewMode || this.props.viewMode.mode);
  }

  /**
   * If Context menu is showed set it to false'
   *
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    if (this.props.contextMenu.show) {
      this.props.showGenericContextMenu(false, null, 0, 0);
    }
  }

  setViewMode(mode) {
    if (mode === 'Graphical View') {
      this.props.filter({ cellFilter: '1' });
    } else {
      this.props.filter({ cellFilter: '' });
    }
    localStorage.setItem('view-mode', mode);
    this.props.setViewMode(mode);
  }

  /**
   * Mapping between a input and a filter option value
   *
   * @param {string} id - id of input in DOM
   * @return {?} the value for the input
   */
  getFilterOptionValue(id) {
    let value = false;

    const optionMap = {
      inQueue: this.props.filterOptions.inQueue,
      notInQueue: this.props.filterOptions.notInQueue,
      collected: this.props.filterOptions.collected,
      notCollected: this.props.filterOptions.notCollected,
      limsSamples: this.props.filterOptions.limsSamples,
      filterText: this.props.filterOptions.text,
      cellFilter: this.props.filterOptions.cellFilter,
      puckFilter: this.props.filterOptions.puckFilter,
    };

    value = optionMap[id];

    return value;
  }

  getCellFilterOptions() {
    let options = [];

    const sampleListByCellNb = Object.values(this.props.sampleList).map(
      (sample) => sample.cell_no,
    );
    // we create a list from all cell numbers and keep unique value and then sort ascending
    const sampleListByCellNbUniqueVal = [...new Set(sampleListByCellNb)].sort(
      (va, vb) => va - vb,
    );

    if (this.props.sampleList) {
      options = sampleListByCellNbUniqueVal.map((cell) => (
        <option key={`filter-cell-${cell}`} value={cell}>
          {cell}
        </option>
      ));
    }

    if (this.props.viewMode.mode !== 'Graphical View') {
      options.push(
        <option key="all" value="">
          ALL
        </option>,
      );
    }

    return options;
  }

  getPuckFilterOptions() {
    let options = [];

    const sampleListByPuckNb = Object.values(this.props.sampleList).map(
      (sample) => sample.puck_no,
    );
    // we create a list from all puck numbers and keep unique value and then sort ascending
    const sampleListByPuckNbUniqueVal = [...new Set(sampleListByPuckNb)].sort(
      (va, vb) => va - vb,
    );

    if (this.props.sampleList) {
      options = sampleListByPuckNbUniqueVal.map((puck) => (
        <option key={`filter-puck-${puck}`} value={puck}>
          {puck}
        </option>
      ));
    }
    options.push(
      <option key="all" value="">
        ALL
      </option>,
    );

    return options;
  }

  /**
   * Helper function that displays a task form
   *
   * @param {string} formName - [Characterisation, DataCollection, AddSample]
   * @property {Object} selected
   * @property {Object} sampleList
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  showTaskForm(formName, extraParams = {}) {
    let prefix = '';
    const path = '';
    let subdir = `${this.props.queue.groupFolder}`;

    if (formName === 'AddSample') {
      this.props.showTaskParametersForm('AddSample');
    } else {
      if (Object.keys(this.props.selected).length === 1) {
        prefix =
          this.props.sampleList[Object.keys(this.props.selected)[0]]
            .defaultPrefix;
        subdir +=
          this.props.sampleList[Object.keys(this.props.selected)[0]]
            .defaultSubDir;
      } else {
        let type =
          formName === 'Generic' ? extraParams.type : formName.toLowerCase();
        type = formName === 'Workflow' ? 'datacollection' : type;

        prefix =
          this.props.defaultParameters[type].acq_parameters.prefixTemplate;
        subdir +=
          this.props.defaultParameters[type].acq_parameters.subDirTemplate;
      }

      const type =
        formName === 'Generic' ? extraParams.type : formName.toLowerCase();
      const params =
        formName !== 'Workflow'
          ? this.props.defaultParameters[type].acq_parameters
          : this.props.defaultParameters.datacollection.acq_parameters;

      const parameters = {
        parameters: {
          ...params,
          ...extraParams,
          prefix,
          path,
          subdir,
          shape: -1,
        },
        type,
      };

      const selected = [];

      for (const sampleID in this.props.selected) {
        if (this.props.selected[sampleID]) {
          selected.push(sampleID);
        }
      }

      if (formName === 'AddSample') {
        this.props.showTaskParametersForm('AddSample');
      } else {
        this.props.showTaskParametersForm(formName, selected, parameters);
      }
    }
  }

  /**
   * Synchronises samples with ISPyB
   *
   * @property {Object} loginData
   */
  syncSamples() {
    if (Object.keys(this.props.sampleList).length === 0) {
      // eslint-disable-next-line promise/prefer-await-to-then, promise/catch-or-return
      this.props.getSamples().then(() => {
        this.props.syncSamples();
      });
    } else {
      this.props.syncSamples();
    }
  }

  /**
   * @return {boolean} true if any filter option is used
   */
  filterIsUsed() {
    return (
      this.props.filterOptions.inQueue ||
      this.props.filterOptions.notInQueue ||
      this.props.filterOptions.collected ||
      this.props.filterOptions.notCollected ||
      this.props.filterOptions.limsSamples ||
      this.props.filterOptions.text.length > 0
    );
  }

  /**
   * Applies filter defined by user
   */
  sampleGridFilter(e) {
    const optionMap = {
      cellFilter: { cellFilter: e.target.value },
      puckFilter: { puckFilter: e.target.value },
      inQueue: { inQueue: e.target.checked },
      notInQueue: { notInQueue: e.target.checked },
      collected: { collected: e.target.checked },
      notCollected: { notCollected: e.target.checked },
      limsSamples: { limsSamples: e.target.checked },
      filterText: { text: ReactDOM.findDOMNode(this.filterInput).value.trim() }, // eslint-disable-line react/no-find-dom-node
    };
    this.props.filter(optionMap[e.target.id]);
    if (Number(e.target.value) > 2) {
      window.scroll({
        top: 1,
        left: 0,
        behavior: 'smooth',
      });
    }
  }

  /**
   *  Clears the filter
   */
  sampleGridClearFilter() {
    this.props.filter({
      inQueue: false,
      notInQueue: false,
      collected: false,
      notCollected: false,
      limsFilter: false,
      filterText: '',
      cellFilter: '',
      puckFilter: '',
    });
  }

  /**
   * @return {number} number of sammples in queue
   */
  numSamplesPicked() {
    const samples = [];

    this.props.queue.queue.forEach((sampleID) => {
      if (this.inQueue(sampleID)) {
        samples.push(sampleID);
      }
    });

    return samples.length;
  }

  /**
   * @return {boolean} true if collect should be disabled otherwise false
   */
  isCollectDisabled() {
    return this.numSamplesPicked() === 0;
  }

  /**
   * Checks if sample with sampleID is in queue
   *
   * @param {string} sampleID
   * @property {Object} queue
   * @return {boolean} true if sample with sampleID is in queue otherwise false
   */
  inQueue(sampleID) {
    return (
      this.props.queue.queue.includes(sampleID) &&
      this.props.sampleList[sampleID].checked
    );
  }

  /**
   * Adds samples with sampleIDs in sampleIDList, removes the samples if they
   * are already in the queue.
   *
   * @param {array} sampleIDList - array of sampleIDs to add or remove
   */
  inQueueDeleteElseAddSamples(sampleIDList, addSamples) {
    const samples = [];
    const samplesToRemove = [];
    for (const sampleID of sampleIDList) {
      if (this.inQueue(sampleID)) {
        // Do not remove currently mounted sample
        if (this.props.queue.current.sampleID !== sampleID) {
          samplesToRemove.push(sampleID);
        }
      } else {
        samples.push(sampleID);
      }
    }

    if (samplesToRemove.length > 0) {
      this.props.setEnabledSample(samplesToRemove, false);
    }
    if (addSamples && samples.length > 0) {
      this.addSamplesToQueue(samples);
    }
  }

  /**
   * Removes selected samples from queue
   */
  removeSelectedSamples() {
    const samplesToRemove = [];
    for (const sampleID of Object.keys(this.props.selected)) {
      if (
        this.inQueue(sampleID) &&
        sampleID !== this.props.sampleChanger.loadedSample.address
      ) {
        samplesToRemove.push(sampleID);
      }
    }
    this.props.setEnabledSample(samplesToRemove, false);
  }

  /**
   * Removes samples from queue
   */
  removeSamplesFromQueue(samplesList) {
    const samplesToRemove = [];
    for (const sampleID of samplesList) {
      if (
        this.inQueue(sampleID) &&
        sampleID !== this.props.sampleChanger.loadedSample.address
      ) {
        samplesToRemove.push(sampleID);
      }
    }

    this.props.deleteSamplesFromQueue(samplesToRemove);
  }

  /**
   * Removes all tasks of selected samples
   */
  removeSelectedTasks() {
    const selectedSamplesID = Object.keys(this.props.selected);
    this.props.deleteTaskList(selectedSamplesID);
  }

  /**
   * @returns {number} total number of samples
   */
  numSamples() {
    return Object.keys(this.props.sampleList).length;
  }

  /**
   * Selects all samples
   */
  selectAllSamples() {
    this.props.selectSamples(Object.keys(this.props.sampleList));
  }

  /**
   * Un-selects all samples
   */
  clearSelectedSamples() {
    this.props.selectSamples(Object.keys(this.props.sampleList), false);
  }

  /**
   * Adds samples in sampleIDList to queue
   *
   * @param {array} sampleIDList - array of sampleIDs to add
   */
  addSamplesToQueue(sampleIDList) {
    const samplesToAdd = sampleIDList.map((sampleID) => {
      return { ...this.props.sampleList[sampleID], checked: true, tasks: [] };
    });
    if (samplesToAdd.length > 0) {
      this.props.addSamplesToQueue(samplesToAdd);
    }
  }

  /**
   * Adds all selected samples to queue
   */
  addSelectedSamplesToQueue() {
    this.addSamplesToQueue(Object.keys(this.props.selected));
  }

  /**
   * Start collection
   */
  startCollect() {
    this.props.router.navigate('/datacollection', { replace: true });
    this.props.showConfirmCollectDialog();
  }

  /**
   * Collect button markup
   */
  collectButton() {
    const collectText = `Collect ${this.numSamplesPicked()}/${this.numSamples()}`;

    let button = (
      <Button
        variant="success"
        onClick={this.startCollect}
        disabled={this.isCollectDisabled()}
        style={{ whiteSpace: 'nowrap' }}
      >
        {collectText}
        <i className="fas fa-chevron-right ms-1" />
      </Button>
    );

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      button = (
        <Button
          variant="danger"
          onClick={this.props.sendStopQueue}
          style={{ marginLeft: '1em' }}
        >
          <b> Stop queue </b>
        </Button>
      );
    }

    return button;
  }

  render() {
    const innerSearchIcon = (
      <DropdownButton
        variant="outline-secondary"
        id="filter-drop-down"
        title="Filter options"
      >
        <div style={{ padding: '1em 1em 0 1em', width: '350px' }}>
          <b>
            Filter <i className="fas fa-filter" />{' '}
          </b>
          <hr />
          <Form.Group as={Row} size="small">
            <Form.Label column sm="3">
              {' '}
              Cell &nbsp;
            </Form.Label>
            <Form.Label column sm="1">
              {' '}
              : &nbsp;
            </Form.Label>
            <Col sm="6">
              <Form.Select
                id="cellFilter"
                value={this.getFilterOptionValue('cellFilter')}
                onChange={this.sampleGridFilter}
              >
                {this.getCellFilterOptions()}
              </Form.Select>
            </Col>
          </Form.Group>
          <Form.Group as={Row} size="small">
            <Form.Label column sm="3">
              {' '}
              Puck &nbsp;
            </Form.Label>
            <Form.Label column sm="1">
              {' '}
              : &nbsp;
            </Form.Label>
            <Col sm="6">
              <Form.Select
                id="puckFilter"
                value={this.getFilterOptionValue('puckFilter')}
                onChange={this.sampleGridFilter}
              >
                {this.getPuckFilterOptions()}
              </Form.Select>
            </Col>
          </Form.Group>
          <Row className="mb-2">
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                id="inQueue"
                inline
                checked={this.getFilterOptionValue('inQueue')}
                onChange={this.sampleGridFilter}
                label="In Queue"
              />
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                inline
                id="notInQueue"
                checked={this.getFilterOptionValue('notInQueue')}
                onChange={this.sampleGridFilter}
                label="Not in Queue"
              />
            </Col>
          </Row>
          <Row className="mb-2">
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                inline
                id="collected"
                checked={this.getFilterOptionValue('collected')}
                onChange={this.sampleGridFilter}
                label="Collected"
              />
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                inline
                id="notCollected"
                checked={this.getFilterOptionValue('notCollected')}
                onChange={this.sampleGridFilter}
                label="Not Collected"
              />
            </Col>
          </Row>
          <Row className="mb-2">
            <Col xs={9}>
              <Form.Check
                type="checkbox"
                inline
                id="limsSamples"
                checked={this.getFilterOptionValue('limsSamples')}
                onChange={this.sampleGridFilter}
                label="ISPyB Samples"
              />
            </Col>
            <Col xs={3}>
              <span />
            </Col>
          </Row>
          <Row className="mt-3 justify-content-end">
            <Col className="align-self-end">
              <Button
                variant="outline-secondary"
                style={{ float: 'right' }}
                onClick={this.sampleGridClearFilter}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </DropdownButton>
    );

    return (
      <Container
        fluid
        id="sampleGridContainer"
        className="samples-grid-table-container mt-4"
      >
        <ConfirmActionDialog
          title="Clear sample grid ?"
          message="This will remove all samples (and collections) from the grid,
                    are you sure you would like to continue ?"
          onOk={this.props.sendClearQueue}
          show={this.props.general.showConfirmClearQueueDialog}
          hide={this.props.confirmClearQueueHide}
        />
        {this.props.loading ? (
          <div className="center-in-box" style={{ zIndex: 1200 }}>
            <img src={loader} className="img-centerd img-responsive" alt="" />
          </div>
        ) : null}
        <Card className="samples-grid-table-card">
          <Card.Header
            onMouseDown={this.onMouseDown}
            className="samples-grid-table-card-header"
          >
            <Row className="samples-grid-table-row-header">
              <Col sm={4} className="d-flex">
                <SplitButton
                  variant="outline-secondary"
                  className="nowrap-style"
                  id="split-button-sample-changer-selection"
                  disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  title="Get samples from SC"
                  onClick={this.props.getSamples}
                >
                  <Dropdown.Item
                    className="nowrap-style"
                    eventKey="2"
                    onClick={this.showAddSampleForm}
                  >
                    Create new sample
                  </Dropdown.Item>
                </SplitButton>
                <span style={{ marginLeft: '1.5em' }} />
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="select-samples">
                      Synchronise sample list with ISPyB
                    </Tooltip>
                  }
                >
                  <Button
                    className="nowrap-style"
                    variant="outline-secondary"
                    onClick={this.syncSamples}
                  >
                    <i
                      className="fas fa-sync-alt"
                      style={{ marginRight: '0.5em' }}
                    />
                    ISPyB
                  </Button>
                </OverlayTrigger>
                <span style={{ marginLeft: '1.5em' }} />
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Tooltip id="select-samples">
                      Remove all samples from sample list and queue
                    </Tooltip>
                  }
                >
                  <Button
                    className="nowrap-style"
                    variant="outline-secondary"
                    onClick={this.props.confirmClearQueueShow}
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  >
                    <i
                      className="fas fa-minus"
                      style={{ marginRight: '0.5em' }}
                    />
                    Clear sample list
                  </Button>
                </OverlayTrigger>
                <span style={{ marginLeft: '1.5em' }} />
                <Dropdown>
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="dropdown-basic"
                  >
                    <MdGridView size="1em" /> View Mode
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {this.props.viewMode.options.map((option) => (
                      <Dropdown.Item
                        key={option}
                        onClick={() => this.setViewMode(option)}
                      >
                        {option}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col md={{ span: 4, offset: 1 }} className="d-flex me-auto">
                <Form>
                  <Form.Group as={Row} className="d-flex">
                    <Form.Label
                      style={{ whiteSpace: 'nowrap' }}
                      className="d-flex"
                      column
                      sm="2"
                    >
                      Filter :
                    </Form.Label>
                    <Col sm="9">
                      <InputGroup
                        className={
                          this.filterIsUsed() ? 'filter-input-active' : ''
                        }
                      >
                        <Form.Control
                          style={{ borderColor: '#CCC' }}
                          id="filterText"
                          type="text"
                          ref={(ref) => {
                            this.filterInput = ref;
                          }}
                          defaultValue={this.props.filterOptions.text}
                          onChange={this.sampleGridFilter}
                        />
                        {innerSearchIcon}
                      </InputGroup>
                    </Col>
                  </Form.Group>
                </Form>
                <span style={{ marginLeft: '1em' }} />
                <SplitButton
                  id="pipeline-mode-dropdown"
                  variant="outline-secondary"
                  disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  onClick={this.addSelectedSamplesToQueue}
                  title={
                    <span className="nowrap-style">
                      <i className="fas fa-plus" /> Add to Queue
                    </span>
                  }
                >
                  <Dropdown.Item
                    eventKey="2"
                    onClick={this.showDataCollectionForm}
                  >
                    Add Data collection
                  </Dropdown.Item>
                  <Dropdown.Item
                    eventKey="3"
                    onClick={this.showCharacterisationForm}
                  >
                    Add Characterisation
                  </Dropdown.Item>
                </SplitButton>
              </Col>
              <Col className="d-flex justify-content-end" sm={3}>
                <span style={{ marginLeft: '1em' }} />
                <QueueSettings />
                <span style={{ marginLeft: '1em' }} />
                {this.collectButton()}
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="samples-grid-table-card-body">
            <SampleGridTableContainer
              addSelectedSamplesToQueue={this.addSelectedSamplesToQueue}
              addSamplesToQueue={this.addSamplesToQueue}
              showCharacterisationForm={this.showCharacterisationForm}
              showDataCollectionForm={this.showDataCollectionForm}
              showWorkflowForm={this.showWorkflowForm}
              inQueue={this.inQueue}
              inQueueDeleteElseAddSamples={this.inQueueDeleteElseAddSamples}
              removeSamplesFromQueue={this.removeSamplesFromQueue}
              removeSelectedSamples={this.removeSelectedSamples}
              removeSelectedTasks={this.removeSelectedTasks}
              setViewMode={this.setViewMode}
            />
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

/**
 * @property {Object} loginData - current user data
 * @property {Object} sampleList - list of samples
 * @property {array} queue - samples in queue
 * @property {object} selected - contains samples that are currentl selected
 * @property {object} defaultParameters - default task parameters
 * @property {object} filterOptions - current filter options
 * @property {boolean} showConfirmClearQueue
 */
function mapStateToProps(state) {
  return {
    loginData: state.login,
    queue: state.queue,
    loading: state.queueGUI.loading,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    viewMode: state.sampleGrid.viewMode,
    defaultParameters: state.taskForm.defaultParameters,
    filterOptions: state.sampleGrid.filterOptions,
    order: state.sampleGrid.order,
    sampleChanger: state.sampleChanger,
    contextMenu: state.contextMenu.genericContextMenu,
    general: state.general,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleList()),
    setViewMode: (mode) => dispatch(setViewModeAction(mode)),
    filter: (filterOptions) => dispatch(filterAction(filterOptions)),
    syncSamples: () => dispatch(sendSyncSamples()),
    syncSamplesCrims: () => dispatch(syncWithCrims()),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    selectSamples: (keys, selected) =>
      dispatch(selectSamplesAction(keys, selected)),
    deleteSamplesFromQueue: (sampleID) =>
      dispatch(deleteSamplesFromQueue(sampleID)),
    setEnabledSample: (qidList, value) =>
      dispatch(setEnabledSample(qidList, value)),
    deleteTask: (qid, taskIndex) => dispatch(deleteTask(qid, taskIndex)),
    deleteTaskList: (sampleIDList) => dispatch(deleteTaskList(sampleIDList)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSamplesToQueue: (sampleData) => dispatch(addSamplesToQueue(sampleData)),
    sendStopQueue: () => dispatch(sendStopQueue()),
    confirmClearQueueShow: bindActionCreators(
      showConfirmClearQueueDialog,
      dispatch,
    ),
    confirmClearQueueHide: bindActionCreators(
      showConfirmClearQueueDialog.bind(null, false),
      dispatch,
    ),
    showConfirmCollectDialog: bindActionCreators(
      showConfirmCollectDialog,
      dispatch,
    ),
    showGenericContextMenu: (show, id, x, y) =>
      dispatch(showGenericContextMenu(show, id, x, y)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(SampleListViewContainer));
