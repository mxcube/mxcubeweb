import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import withRouter from '../components/WithRouter'
import loader from '../img/loader.gif';

import {
  Container,
  Row, Col, Form,
  Button,
  SplitButton,
  ButtonToolbar,
  DropdownButton,
  InputGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';

import { QUEUE_RUNNING } from '../constants';

import {
  sendGetSampleList,
  sendSyncSamples,
  filterAction,
  selectSamplesAction,
} from '../actions/sampleGrid';

import {
  sendClearQueue,
  deleteSamplesFromQueue,
  setEnabledSample,
  addSamplesToQueue,
  sendStopQueue,
  deleteTask,
} from '../actions/queue';

import { showConfirmCollectDialog } from '../actions/queueGUI';
import { showConfirmClearQueueDialog } from '../actions/general';

import { showTaskForm } from '../actions/taskForm';

import SampleGridContainer from './SampleGridContainer';
import ConfirmActionDialog from '../components/GenericDialog/ConfirmActionDialog';
import QueueSettings from './QueueSettings.jsx';

import { SAMPLE_ITEM_WIDTH,
  SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';

import '../components/SampleGrid/SampleGrid.css';

class SampleGridViewContainer extends React.Component {

  constructor(props) {
    super(props);
    this.onResize = this.onResize.bind(this);
    this.syncSamples = this.syncSamples.bind(this);
    this.sampleGridFilter = this.sampleGridFilter.bind(this);
    this.getFilterOptionValue = this.getFilterOptionValue.bind(this);
    this.sampleGridClearFilter = this.sampleGridClearFilter.bind(this);
    this.filterIsUsed = this.filterIsUsed.bind(this);
    this.resizeGridContainer = this.resizeGridContainer.bind(this);
    this.getPuckFilterOptions = this.getPuckFilterOptions.bind(this);

    // Methods for handling addition and removal of queue items (Samples and Tasks)
    // Also used by the SampleGridContainer
    this.addSelectedSamplesToQueue = this.addSelectedSamplesToQueue.bind(this);
    this.selectAllSamples = this.selectAllSamples.bind(this);
    this.clearSelectedSamples = this.clearSelectedSamples.bind(this);
    this.showCharacterisationForm = this.showTaskForm.bind(this, 'Characterisation', {});
    this.showDataCollectionForm = this.showTaskForm.bind(this, 'DataCollection', {});
    this.showWorkflowForm = this.showTaskForm.bind(this, 'Workflow');
    this.showAddSampleForm = this.showTaskForm.bind(this, 'AddSample');
    this.inQueue = this.inQueue.bind(this);
    this.inQueueDeleteElseAddSamples = this.inQueueDeleteElseAddSamples.bind(this);
    this.removeSelectedSamples = this.removeSelectedSamples.bind(this);
    this.removeSelectedTasks = this.removeSelectedTasks.bind(this);

    this.collectButton = this.collectButton.bind(this);
    this.startCollect = this.startCollect.bind(this);
  }


  componentDidMount() {
    window.addEventListener('resize', this.onResize, false);
    this.resizeGridContainer();
  }


  componentDidUpdate() {
    this.resizeGridContainer();
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }


  onResize() {
    this.forceUpdate();
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
      puckFilter: this.props.filterOptions.puckFilter
    };

    value = optionMap[id];

    return value;
  }


  getPuckFilterOptions() {
    const sc = this.props.sampleChanger.contents;
    let options = [];

    if (sc.children) {
      options = Object.values(sc.children).map((basket) => (
        (<option key={basket.name} value={`${basket.name}:`}>{basket.name}</option>)
      ));
    }

    options.push((<option key="all" value="">ALL</option>));

    return options;
  }


  /**
   * Calculates the grid width
   *
   * return {number} width in pixels
   */
  calcGridWidth() {
    // We know that the side menu is fixed width 65px and that the padding from
    // bootstrap is 15px so content starts at 80px;

    // Get the viewportWidth
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    // The full content width for this media (not forgeting the padding to the right 15px)
    const fullContentWidth = viewportWidth - 80 - 15;

    // Each sample item is 190px wide, calculate maximum number of items for each row
    const numCols = Math.floor(fullContentWidth / SAMPLE_ITEM_WIDTH);

    // Caculating the actual grid size, with space between sample items;
    const actualGridWidth = numCols * (SAMPLE_ITEM_WIDTH + 2 + SAMPLE_ITEM_SPACE) + 10;

    return [actualGridWidth, numCols];
  }


  /**
   * Resizes the grid container element (with id smapleGridContainer)
   */
  resizeGridContainer() {
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const width = Math.min(viewportWidth, this.calcGridWidth()[0] || 0);
    document.querySelector('#sampleGridContainer').style.width = `${width - 38}px`;
  }


  /**
   * Helper function that displays a task form
   *
   * @param {string} formName - [Characterisation, DataCollection, AddSample]
   * @property {Object} selected
   * @property {Object} sampleList
   */
  showTaskForm(formName, extraParams = {}) {
    let prefix = '';
    const path = '';
    let subdir = `${this.props.queue.groupFolder}`;


    if (formName === 'AddSample') {
      this.props.showTaskParametersForm('AddSample');
    } else {
      if (Object.keys(this.props.selected).length === 1) {
        prefix = this.props.sampleList[Object.keys(this.props.selected)[0]].defaultPrefix;
        subdir += this.props.sampleList[Object.keys(this.props.selected)[0]].defaultSubDir;
      } else {
        prefix = this.props.defaultParameters[formName.toLowerCase()].prefixTemplate;
        subdir += this.props.defaultParameters[formName.toLowerCase()].subDirTemplate;
      }
  
      const parameters = { parameters: {
        ...this.props.defaultParameters[formName.toLowerCase()],
        ...extraParams,
        prefix,
        path,
        subdir,
        shape: -1 } };
  
      const selected = [];
  
      for (const sampleID in this.props.selected) {
        if (this.props.selected[sampleID]) {
          selected.push(sampleID);
        }
      }

      this.props.showTaskParametersForm(formName, selected, parameters);
    }
  }


  /**
   * Synchronises samples with ISPyB
   *
   * @property {Object} loginData
   */
  syncSamples() {
    if (Object.keys(this.props.sampleList).length === 0) {
      this.props.getSamples().then(() => { this.props.syncSamples(); });
    } else {
      this.props.syncSamples();
    }
  }


  /**
   * @return {boolean} true if any filter option is used
   */
  filterIsUsed() {
    return (this.props.filterOptions.inQueue ||
            this.props.filterOptions.notInQueue ||
            this.props.filterOptions.collected ||
            this.props.filterOptions.notCollected ||
            this.props.filterOptions.limsSamples ||
            (this.props.filterOptions.text.length > 0));
  }


  /**
   * Applies filter defined by user
   */
  sampleGridFilter(e) {
    const optionMap = {
      puckFilter: { puckFilter: e.target.value },
      inQueue: { inQueue: e.target.checked },
      notInQueue: { notInQueue: e.target.checked },
      collected: { collected: e.target.checked },
      notCollected: { notCollected: e.target.checked },
      limsSamples: { limsSamples: e.target.checked },
      filterText: { text: ReactDOM.findDOMNode(this.filterInput).value.trim() }
    };

    this.props.filter(optionMap[e.target.id]);
  }


  /**
   *  Clears the filter
   */
  sampleGridClearFilter() {
    this.props.filter({ inQueue: false,
      notInQueue: false,
      collected: false,
      notCollected: false,
      limsFilter: false,
      filterText: '' });
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
    return this.props.queue.queue.includes(sampleID) && this.props.sampleList[sampleID].checked;
  }


  /**
   * Adds samples with sampleIDs in sampleIDList, removes the samples if they
   * are already in the queue.
   *
   * @param {array} sampleIDList - array of sampleIDs to add or remove
   */
  inQueueDeleteElseAddSamples(sampleIDList) {
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
    if (samples.length > 0) { this.addSamplesToQueue(samples); }
  }


  /**
   * Removes selected samples
   */
  removeSelectedSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.inQueue(sampleID) && sampleID !== this.props.sampleChanger.loadedSample.address) {
        this.props.setEnabledSample([sampleID], false);
      }
    }
  }

  /**
   * Removes all tasks of selected samples
   */
  removeSelectedTasks() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.inQueue(sampleID)) {
        this.props.sampleList[sampleID].tasks.forEach(() => {
          this.props.deleteTask(sampleID, 0);
        });
      }
    }
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

    if (samplesToAdd.length > 0) { this.props.addSamplesToQueue(samplesToAdd); }
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
    this.props.router.navigate('/datacollection' , { replace: true });
    this.props.showConfirmCollectDialog();
  }


  /**
   * Collect button markup
   */
  collectButton() {
    const collectText = `Collect ${this.numSamplesPicked()}/${this.numSamples()}`;

    let button = (
      <Button
        className="btn btn-success"
        variant=''
        onClick={this.startCollect}
        disabled={this.isCollectDisabled()}
        style={{ whiteSpace: 'nowrap'}}
      >
        {collectText}
        <i className="fas fa-chevron-right ms-1" />
      </Button>);

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      button = (
        <Button
          variant=''
          className="btn btn-danger"
          onClick={this.props.sendStopQueue}
          style={{ marginLeft: '1em' }}
        >
          <b> Stop queue </b>
        </Button>);
    }

    return button;
  }


  render() {
    const innerSearchIcon = (
      <DropdownButton
        variant='outline-secondary'
        title="" id="filter-drop-down"
      >
        <div style={{ padding: '1em 1em 0 1em', width: '350px' }}>
          <b>Filter <i className="fas fa-filter" /> </b>
          <hr />
          <Row>
            <Col xs={12}>
              <Row>
                <Col xs={12}>
                  <Form.Group as={Row} size="small" style={{ float: 'none', marginTop: '0.5em' }}>
                      <Form.Label column sm="3"> Basket &nbsp;</Form.Label>
                      <Form.Label column sm="1"> : &nbsp;</Form.Label>
                      <Col sm="6">
                        <Form.Select
                          style={{ float: 'none' }}
                          id="puckFilter"
                          defaultValue={this.getFilterOptionValue('puckFilter')}
                          onChange={this.sampleGridFilter}
                        >
                          {this.getPuckFilterOptions()}
                        </Form.Select>
                      </Col>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row className='mb-2'>
            <Col xs={12}>
              <Row>
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
            </Col>
          </Row>
          <Row className='mb-2'>
            <Col xs={12}>
              <Row>
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
            </Col>
          </Row>
          <Row className='mb-2'>
            <Col xs={12}>
              <Row>
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
            </Col>
          </Row>
          <Row className="mt-3 justify-content-end">
            <Col className='align-self-end'>        
              <Button
                variant="outline-secondary"
                style={{ float: 'right'}}
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
      <Container fluid id="sampleGridContainer" className="samples-grid-container mt-4">
        <ConfirmActionDialog
          title="Clear sample grid ?"
          message="This will remove all samples (and collections) from the grid,
                    are you sure you would like to continue ?"
          onOk={this.props.sendClearQueue}
          show={this.props.general.showConfirmClearQueueDialog}
          hide={this.props.confirmClearQueueHide}
        />
        {this.props.loading ?
          <div className="center-in-box" style={{ zIndex: 1200 }} >
            <img src={loader} className="img-responsive" alt="" />
          </div>
          : null
        }
        <Row className="samples-grid-row-header">
          <Col sm={4} className='d-flex'>
            <Form>
              <SplitButton
                variant='outline-secondary'
                id="split-button-sample-changer-selection"
                disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                title="Get samples from SC"
                onClick={this.props.getSamples}
              >
                <Dropdown.Item eventKey="2" onClick={this.showAddSampleForm}>
                  Create new sample
                </Dropdown.Item>
              </SplitButton>
              <span style={{ marginLeft: '1.5em' }} />
              <OverlayTrigger
                placement="bottom"
                overlay={(
                  <Tooltip id="select-samples">
                    Synchronise sample list with ISPyB
                  </Tooltip>)}
              >
                <Button variant='outline-secondary' onClick={this.syncSamples}>
                  <i className="fas fa-sync-alt" style={{ marginRight: '0.5em' }} />
                  ISPyB
                </Button>
              </OverlayTrigger>
              <span style={{ marginLeft: '1.5em' }} />
              <OverlayTrigger
                placement="bottom"
                overlay={(
                  <Tooltip id="select-samples">
                    Remove all samples from sample list and queue
                  </Tooltip>)}
              >
                <Button
                  variant='outline-secondary'
                  onClick={this.props.confirmClearQueueShow}
                  disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                >
                  <i className="fas fa-minus" style={{ marginRight: '0.5em' }} />
                  Clear sample list
                </Button>
              </OverlayTrigger>
            </Form>
          </Col>
          <Col sm={6} className='d-flex'>
            <Form>
              <Form.Group  as={Row} className="mb-3 d-flex">
                <Form.Label style={{ whiteSpace: 'nowrap', marginRight: '0px'}} className="d-flex" column sm="2">Filter :</Form.Label>
                <Col sm="9">
                  <InputGroup className={this.filterIsUsed() ? 'filter-input-active' : ''}>
                    <Form.Control
                      style={{ borderColor: '#CCC' }}
                      id="filterText"
                      type="text"
                      ref={(ref) => { this.filterInput = ref; }}
                      defaultValue={this.props.filterOptions.text}
                      onChange={this.sampleGridFilter}
                    />
                    {innerSearchIcon}
                  </InputGroup>
                </Col>
              </Form.Group>
            </Form>
            <span style={{ marginLeft: '3em' }} />
            <Form>
              <SplitButton
                id="pipeline-mode-dropdown"
                variant='outline-secondary'
                disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                onClick={this.addSelectedSamplesToQueue}
                title={<span ><i className="fas fa-plus" /> Add to Queue</span>}
              >
                <Dropdown.Item eventKey="2" onClick={this.showDataCollectionForm}>
                  Add Data collection
                    </Dropdown.Item>
                <Dropdown.Item eventKey="3" onClick={this.showCharacterisationForm}>
                  Add Characterisation
                    </Dropdown.Item>
              </SplitButton>
            </Form>
          </Col>
          <Col className='d-flex justify-content-end' sm={2}>
            <ButtonToolbar className="mb-3 justify-content-end">
              <QueueSettings />
              <span style={{ marginLeft: '1em' }} />
              {this.collectButton()}
            </ButtonToolbar>
          </Col>
        </Row>
        <SampleGridContainer
          addSelectedSamplesToQueue={this.addSelectedSamplesToQueue}
          showCharacterisationForm={this.showCharacterisationForm}
          showDataCollectionForm={this.showDataCollectionForm}
          showWorkflowForm={this.showWorkflowForm}
          addSamplesToQueue={this.addSamplesToQueue}
          inQueue={this.inQueue}
          inQueueDeleteElseAddSamples={this.inQueueDeleteElseAddSamples}
          removeSelectedSamples={this.removeSelectedSamples}
          removeSelectedTasks={this.removeSelectedTasks}
          gridWidth={this.calcGridWidth()}
        />
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
    defaultParameters: state.taskForm.defaultParameters,
    filterOptions: state.sampleGrid.filterOptions,
    sampleChanger: state.sampleChanger,
    general: state.general
  };
}


function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleList()),
    filter: (filterOptions) => dispatch(filterAction(filterOptions)),
    syncSamples: () => dispatch(sendSyncSamples()),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    selectSamples: (keys, selected) => dispatch(selectSamplesAction(keys, selected)),
    deleteSamplesFromQueue: (sampleID) => dispatch(deleteSamplesFromQueue(sampleID)),
    setEnabledSample: (qidList, value) => dispatch(setEnabledSample(qidList, value)),
    deleteTask: (qid, taskIndex) => dispatch(deleteTask(qid, taskIndex)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSamplesToQueue: (sampleData) => dispatch(addSamplesToQueue(sampleData)),
    sendStopQueue: () => dispatch(sendStopQueue()),
    confirmClearQueueShow: bindActionCreators(showConfirmClearQueueDialog, dispatch),
    confirmClearQueueHide:
      bindActionCreators(showConfirmClearQueueDialog.bind(this, false), dispatch),
    showConfirmCollectDialog: bindActionCreators(showConfirmCollectDialog, dispatch)
  };
}

SampleGridViewContainer = withRouter(SampleGridViewContainer);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridViewContainer);
