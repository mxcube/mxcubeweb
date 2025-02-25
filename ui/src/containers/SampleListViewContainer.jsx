/* eslint-disable react/jsx-handler-names */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import withNavigate from '../components/withNavigate.jsx';
import loader from '../img/loader.gif';

import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  DropdownButton,
  InputGroup,
  Dropdown,
} from 'react-bootstrap';

import { MdGridView } from 'react-icons/md';

import { LuSettings2 } from 'react-icons/lu';

import { QUEUE_RUNNING, isCollected, hasLimsData } from '../constants';

import {
  getSamplesList,
  setViewModeAction,
  syncSamples,
  syncWithCrims,
  filterAction,
  selectSamplesAction,
  showGenericContextMenu,
} from '../actions/sampleGrid';

import {
  deleteSamplesFromQueue,
  setEnabledSample,
  addSamplesToQueue,
  stopQueue,
  deleteTask,
  deleteTaskList,
} from '../actions/queue';

import { showConfirmCollectDialog } from '../actions/queueGUI';
import { showConfirmClearQueueDialog } from '../actions/general';

import { showTaskForm } from '../actions/taskForm';

import SampleGridTableContainer from './SampleGridTableContainer';

import QueueSettings from './QueueSettings.jsx';

import '../components/SampleGrid/SampleGridTable.css';
import TooltipTrigger from '../components/TooltipTrigger.jsx';

class SampleListViewContainer extends React.Component {
  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);
    this.mutualExclusiveFilterOption =
      this.mutualExclusiveFilterOption.bind(this);
    this.inQueueSampleID = this.inQueueSampleID.bind(this);
    this.filter = this.filter.bind(this);
    this.sampleGridFilter = this.sampleGridFilter.bind(this);
    this.getFilterOptionValue = this.getFilterOptionValue.bind(this);
    this.sampleGridClearFilter = this.sampleGridClearFilter.bind(this);
    this.filterIsUsed = this.filterIsUsed.bind(this);
    this.renderCellFilterOptions = this.renderCellFilterOptions.bind(this);

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
    this.getSamplesFromSC = this.getSamplesFromSC.bind(this);
    this.renderCollectButton = this.renderCollectButton.bind(this);
    this.startCollect = this.startCollect.bind(this);
  }

  componentDidMount() {
    const localStorageViewMode = localStorage.getItem('view-mode');
    this.setViewMode(localStorageViewMode || this.props.viewMode.mode);
  }

  setViewMode(mode) {
    if (this.props.type.includes('FLEX') && mode.includes('Graphical')) {
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

  renderCellFilterOptions() {
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

  renderPuckFilterOptions() {
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
        this.props.showTaskParametersForm(
          formName,
          selected,
          parameters,
          -1,
          'samplelist',
        );
      }
    }
  }

  async getSamplesFromSC() {
    const manualSamples = [];
    Object.values(this.props.sampleList).forEach((sample) => {
      if (sample.location === 'Manual') {
        manualSamples.push(sample.sampleID);
      }
    });
    // first need to remove manual sample from queue
    // because they will be remove from sample List
    await this.props.setEnabledSample(manualSamples, false);

    this.props.getSamplesList();
  }

  /**
   * Synchronises samples with LIMS
   *
   * @property {Object} loginData
   */
  async syncSamples(lims) {
    if (Object.keys(this.props.sampleList).length === 0) {
      await this.getSamplesFromSC();
      this.props.syncSamples(lims);
    } else {
      this.props.syncSamples(lims);
    }
    this.props.filter({ limsSamples: true });
  }

  /**
   * Helper function for filter that takes a sample object instead of sampleID
   *
   * @param {object} sample
   * return {boolean} true if sample is in queue otherwise false
   */
  inQueueSampleID(sample) {
    return this.inQueue(sample.sampleID);
  }

  /**
   * Performs filtering on a sample with two options that are mutually exclusive
   * Includes sample according to provided options o1 and o2, always includes the
   * sample if both options are either true or false simultaneously (ignoring the
   * options o1 and o2)
   *
   * @property {Object} filterOptions
   * @param {Object} sample
   * @param {string} o1 - option name 1
   * @param {string} o2 - option name 2
   * @param {function} fun - function that tests for inclusion
   *
   * return {boolean} true if item is to be included otherwise false
   */
  mutualExclusiveFilterOption(sample, o1, o2, testFun) {
    let includeItem = false;

    // First case is included for clarity since the two options
    // cancel each other out. Dont do anything same as both false. Otherwise
    // apply filter.

    if (this.props.filterOptions[o1] && this.props.filterOptions[o2]) {
      includeItem = true;
    } else if (!this.props.filterOptions[o1] && !this.props.filterOptions[o2]) {
      includeItem = true;
    } else if (this.props.filterOptions[o1]) {
      includeItem = testFun(sample);
    } else if (this.props.filterOptions[o2]) {
      includeItem = !testFun(sample);
    }

    return includeItem;
  }

  /**
   * Filter function for SampleItems
   *
   * @property {Object} sampleList
   * @property {Object} filterOptions
   *
   * @param {string} key - sampleID
   *
   * return {boolean} true if item is to be excluded otherwise false
   */
  filter(key) {
    const sample = this.props.sampleList[key];
    let fi = false;
    if (sample) {
      const sampleFilter =
        `${sample.sampleName} ${sample.proteinAcronym}`.toLowerCase();

      fi = sampleFilter.includes(this.props.filterOptions.text.toLowerCase());

      // eslint-disable-next-line no-bitwise
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'inQueue',
        'notInQueue',
        this.inQueueSampleID,
      );
      // eslint-disable-next-line no-bitwise
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'collected',
        'notCollected',
        isCollected,
      );
      // eslint-disable-next-line no-bitwise
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'limsSamples',
        '',
        hasLimsData,
      );
      if (this.props.filterOptions.cellFilter !== '') {
        // eslint-disable-next-line no-bitwise
        fi &= sample.cell_no === Number(this.props.filterOptions.cellFilter);
      }
      if (this.props.filterOptions.puckFilter !== '') {
        // eslint-disable-next-line no-bitwise
        fi &= sample.puck_no === Number(this.props.filterOptions.puckFilter);
      }
    }

    return fi;
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
      this.props.filterOptions.text.length > 0 ||
      this.props.filterOptions.cellFilter !== '' ||
      this.props.filterOptions.puckFilter !== ''
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
      limsSamples: false,
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
        if (this.props.queue.currentSampleID !== sampleID) {
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

  displayContextMenu(e, contextMenuID) {
    if (this.props.queue.queueStatus !== QUEUE_RUNNING) {
      this.props.showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY);
    }

    const samplesListKeys = Object.keys(this.props.sampleList).filter((key) =>
      this.filter(key),
    );

    this.props.selectSamples(samplesListKeys);
    e.stopPropagation();
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
    this.props.navigate('/datacollection', { replace: true });
    this.props.showConfirmCollectDialog();
  }

  getSynchronizationDropDownList() {
    if (this.props.loginData.limsName.length === 1) {
      return (
        <TooltipTrigger
          id="sync-samples-tooltip"
          tooltipContent={`Synchronise sample list with ${this.props.loginData.limsName[0].name}`}
        >
          <Button
            className="nowrap-style"
            variant="outline-secondary"
            onClick={() =>
              this.syncSamples(this.props.loginData.limsName[0].name)
            }
          >
            <i className="fas fa-sync-alt" style={{ marginRight: '0.5em' }} />
            Get Samples
          </Button>
        </TooltipTrigger>
      );
    }
    return (
      <Dropdown>
        <Dropdown.Toggle variant="outline-secondary" id="dropdown-lims">
          <i className="fas fa-sync-alt" style={{ marginRight: '0.5em' }} />{' '}
          Synchronize with
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {this.props.loginData.limsName.map((lims) => (
            <TooltipTrigger
              key={lims.name}
              tooltipContent={`Synchronise sample list with ${lims.name}`}
            >
              <Dropdown.Item
                key={lims.name}
                onClick={() => this.syncSamples(lims.name)}
              >
                {lims.name}
              </Dropdown.Item>
            </TooltipTrigger>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  /**
   * Collect button markup
   */
  renderCollectButton() {
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
          onClick={this.props.stopQueue}
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
                {this.renderCellFilterOptions()}
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
                {this.renderPuckFilterOptions()}
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
                label="LIMS Samples"
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
        {this.props.loading ? (
          <div
            className="center-in-box"
            style={{ zIndex: 1200, position: 'fixed' }}
          >
            <img
              src={loader}
              className="img-centerd img-responsive"
              width="150"
              alt=""
            />
          </div>
        ) : null}
        <Card className="samples-grid-table-card">
          <Card.Header className="samples-grid-table-card-header">
            <Row className="gap-2">
              <Col className="d-flex">
                {this.getSynchronizationDropDownList()}
                <span style={{ marginLeft: '1.5em' }} />
                <Button
                  className="nowrap-style"
                  variant="outline-secondary"
                  onClick={this.showAddSampleForm}
                >
                  <i className="fas fa-plus" style={{ marginRight: '0.5em' }} />
                  Create new sample
                </Button>
                <span style={{ marginLeft: '1.5em' }} />
                <TooltipTrigger
                  id="clear-samples-tooltip"
                  tooltipContent="Remove all samples from sample list and queue"
                >
                  <Button
                    className="nowrap-style"
                    variant="outline-secondary"
                    onClick={this.props.showConfirmClearQueueDialog}
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  >
                    <i
                      className="fas fa-minus"
                      style={{ marginRight: '0.5em' }}
                    />
                    Clear sample list
                  </Button>
                </TooltipTrigger>
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
              <Col className="d-flex me-auto">
                <Form onSubmit={(evt) => evt.preventDefault()}>
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
                <span style={{ marginLeft: '2em' }} />
                <Button
                  variant="outline-secondary"
                  className="nowrap-style"
                  title="Context Menu to Add DC or Workflow to all filtered Samples Options"
                  onClick={(e) => {
                    this.displayContextMenu(
                      e,
                      'samples-grid-table-context-menu-cell',
                    );
                  }}
                >
                  Add Task to Samples <LuSettings2 />
                </Button>
              </Col>
              <Col className="d-flex justify-content-end">
                <span style={{ marginLeft: '1em' }} />
                <QueueSettings />
                <span style={{ marginLeft: '1em' }} />
                {this.renderCollectButton()}
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
              filterSampleByKey={this.filter}
              type={this.props.type}
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
    type: state.sampleChanger.contents
      ? state.sampleChanger.contents.name
      : 'Mockup',
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamplesList: () => dispatch(getSamplesList()),
    setViewMode: (mode) => dispatch(setViewModeAction(mode)),
    filter: (filterOptions) => dispatch(filterAction(filterOptions)),
    syncSamples: (lims) => dispatch(syncSamples(lims)),
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
    addSamplesToQueue: (sampleData) => dispatch(addSamplesToQueue(sampleData)),
    stopQueue: () => dispatch(stopQueue()),
    showConfirmClearQueueDialog: bindActionCreators(
      showConfirmClearQueueDialog,
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
)(withNavigate(SampleListViewContainer));
