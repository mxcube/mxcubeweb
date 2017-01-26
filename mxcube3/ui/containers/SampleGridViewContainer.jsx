import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { StickyContainer, Sticky } from 'react-sticky';

import {
  Input,
  Button,
  Glyphicon,
  SplitButton,
  DropdownButton,
  MenuItem,
  ButtonGroup,
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
  addSamplesToQueue
} from '../actions/queue';

import { showTaskForm } from '../actions/taskForm';
import SampleGridContainer from './SampleGridContainer';

import '../components/SampleGrid/SampleGrid.css';

class SampleGridViewContainer extends React.Component {

  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);
    this.filterSampleGrid = this.filterSampleGrid.bind(this);

    // Methods for handling addition and removal of queue items (Samples and Tasks)
    // Also used by the SampleGridContainer
    this.addSelectedSamplesToQueue = this.addSelectedSamplesToQueue.bind(this);
    this.selectAllSamples = this.selectAllSamples.bind(this);
    this.clearSelectedSamples = this.clearSelectedSamples.bind(this);
    this.showCharacterisationForm = this.showTaskForm.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.showTaskForm.bind(this, 'DataCollection');
    this.showAddSampleForm = this.showTaskForm.bind(this, 'AddSample');
    this.inQueue = this.inQueue.bind(this);
    this.inQueueDeleteElseAddSamples = this.inQueueDeleteElseAddSamples.bind(this);
    this.removeSelectedSamples = this.removeSelectedSamples.bind(this);

    this.collectButton = this.collectButton.bind(this);
    this.startCollect = this.startCollect.bind(this);
  }


  /**
   * Helper function that displays a task form
   *
   * @param {string} formName - [Characterisation, DataCollection, AddSample]
   * @property {Object} selected
   * @property {Object} sampleList
   */
  showTaskForm(formName) {
    let prefix = '';
    let path = '';

    if (Object.keys(this.props.selected).length === 1) {
      prefix = this.props.sampleList[Object.keys(this.props.selected)[0]].defaultPrefix;
      path = this.props.sampleList[Object.keys(this.props.selected)[0]].sampleName;
    }

    const parameters = { parameters: {
      ...this.props.defaultParameters[formName.toLowerCase()],
      prefix, path } };

    const selected = [];

    for (const sampleID in this.props.selected) {
      if (this.props.selected[sampleID]) {
        selected.push(sampleID);
      }
    }

    this.props.showTaskParametersForm(formName, selected, parameters);
  }


  /**
   * Synchronises samples with ISPyB
   *
   * @property {Object} loginData
   */
  syncSamples() {
    let proposalId;

    try {
      proposalId = this.props.loginData.Proposal.proposalId;
    } catch (e) {
      return;
    }

    this.props.syncSamples(proposalId);
  }


  /**
   * Applies filter defined by user
   */
  filterSampleGrid() {
    this.props.filter(this.refs.filterInput.getInputDOMNode().value.trim());
  }


  /**
   * @return {number} number of sammples in queue
   */
  numSamplesPicked() {
    return Object.keys(this.props.queue.queue).length;
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
    return this.props.queue.queue.includes(sampleID);
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
        samplesToRemove.push(sampleID);
      } else {
        samples.push(sampleID);
      }
    }

    if (samplesToRemove.length > 0) { this.props.deleteSamplesFromQueue(samplesToRemove); }
    if (samples.length > 0) { this.addSamplesToQueue(samples); }
  }


  /**
   * Removes selected samples
   */
  removeSelectedSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.inQueue(sampleID)) {
        this.props.deleteSamplesFromQueue([sampleID]);
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
      const sample = { ...this.props.sampleList[sampleID], checked: true, tasks: [] };
      return sample;
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
    window.location = '#/datacollection';
  }


  /**
   * Collect button markup
   */
  collectButton() {
    const collectText = `Collect ${this.numSamplesPicked()}/${this.numSamples()}`;

    let button = (
      <Button
        className="btn btn-success pull-right"
        onClick={this.startCollect}
        disabled={this.isCollectDisabled()}
      >
        {collectText}
        <Glyphicon glyph="chevron-right" />
      </Button>);

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      button = (
        <Button className="btn btn-danger pull-right" >
          <b> Stop queue </b>
        </Button>);
    }

    return button;
  }


  render() {
    const innerSearchIcon = (
      <DropdownButton bstyle="default" id="filter-drop-down" title="">
        <div style={{ padding: '1em', width: '300px' }}>
          <b>Filter:</b>
          <form style={{ marginTop: '1em' }}>
            <div className="row">
              <div className="col-xs-12">
                <div className="col-xs-6">
                  <span>
                    <Input type="radio" name="picked" value="picked" /> <b>Picked</b>
                  </span>
                </div>
                <div className="col-xs-6">
                  <span>
                    <Input type="radio" name="picked" value="notPicked" /> <b>Not Picked</b>
                  </span>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xs-12">
                <div className="col-xs-6">
                  <span>
                    <Input type="radio" name="collected" value="picked" /> <b>Collected</b>
                  </span>
                </div>
                <div className="col-xs-6">
                  <span>
                    <Input type="radio" name="collected" value="notPicked" /> <b>Not Collected</b>
                  </span>
                </div>
              </div>
            </div>
            <div className="pull-right" style={{ paddingTop: '1em', paddingBottom: '1em' }}>
              <ButtonGroup>
                <Button eventKey="1">
                  Clear
                </Button>
                <Button eventKey="2">
                  Apply
                </Button>
              </ButtonGroup>
            </div>
          </form>
        </div>
      </DropdownButton>
    );

    return (
      <StickyContainer>
        <Sticky
          className="samples-grid-header"
          style={{ transform: 'translateZ(1)', marginBottom: '5px' }}
          stickyStyle={{ padding: '10px' }}
        >
          <div className="row">
            <div style={{ paddingLeft: '0px' }} className="col-xs-10">
              <div className="form-inline">
                <SplitButton
                  disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  title={'Get samples from SC'}
                  id="split-button-sample-changer-selection"
                  onClick={this.props.getSamples}
                >
                  <MenuItem eventKey="2" onClick={this.showAddSampleForm}>
                    Create new sample
                  </MenuItem>
                </SplitButton>
                <span style={{ marginLeft: '1em' }} ></span>
                <OverlayTrigger
                  placement="bottom"
                  overlay={(
                    <Tooltip id="select-samples">
                      Synchronise sample list with ISPyB
                    </Tooltip>)}
                >
                  <Button onClick={this.syncSamples}>
                    <Glyphicon glyph="refresh" /> ISPyB
                  </Button>
                </OverlayTrigger>
                <span style={{ marginLeft: '1em' }} ></span>
                <OverlayTrigger
                  placement="bottom"
                  overlay={(
                    <Tooltip id="select-samples">
                      Remove all samples from sample list and queue
                    </Tooltip>)}
                >
                  <Button
                    onClick={this.props.sendClearQueue}
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  >
                    Clear sample list
                  </Button>
                </OverlayTrigger>
                <span style={{ marginLeft: '3em' }}>Filter: </span>
                <span style={{ position: 'absolute', zIndex: 1000 }}>
                  <Input
                    type="text"
                    ref="filterInput"
                    defaultValue={this.props.filterText}
                    buttonAfter={innerSearchIcon}
                    onChange={this.filterSampleGrid}
                  />
                </span>
                <span style={{ marginLeft: '3em' }}>Select: </span>
                <OverlayTrigger
                  placement="bottom"
                  overlay={(<Tooltip id="select-samples">Select samples</Tooltip>)}
                >
                  <ButtonGroup>
                    <Button eventKey="1" onClick={this.selectAllSamples}>
                      All
                    </Button>
                    <Button eventKey="1" onClick={this.clearSelectedSamples}>
                      None
                    </Button>
                  </ButtonGroup>
                </OverlayTrigger>
                <span style={{ marginLeft: '3em' }} ></span>
                <SplitButton
                  disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  onClick={this.addSelectedSamplesToQueue}
                  bsStyle="default"
                  title={<span><Glyphicon glyph="plus" /> En-queue sample</span>}
                  id="pipeline-mode-dropdown"
                >
                  <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
                    Add Data collection
                  </MenuItem>
                  <MenuItem eventKey="3" onClick={this.showCharacterisationForm}>
                    Add Characterisation
                  </MenuItem>
                </SplitButton>
              </div>
             </div>
             <div className="col-xs-2 pull-right">
               {this.collectButton()}
             </div>
          </div>
        </Sticky>
        <div className="row">
          <div className="col-xs-12">
            <SampleGridContainer
              addSelectedSamplesToQueue={this.addSelectedSamplesToQueue}
              showCharacterisationForm={this.showCharacterisationForm}
              showDataCollectionForm={this.showDataCollectionForm}
              addSamplesToQueue={this.addSamplesToQueue}
              inQueue={this.inQueue}
              inQueueDeleteElseAddSamples={this.inQueueDeleteElseAddSamples}
              removeSelectedSamples={this.removeSelectedSamples}
            />
          </div>
        </div>
      </StickyContainer>);
  }
}


/**
 * @property {Object} loginData - current user data
 * @property {Object} sampleList - list of samples
 * @property {array} queue - samples in queue
 * @property {object} selected - contains samples that are currentl selected
 * @property {object} defaultParameters - default task parameters
 * @property {object} filterText - current filter options
 *
 */
function mapStateToProps(state) {
  return {
    loginData: state.login.data,
    queue: state.queue,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    defaultParameters: state.taskForm.defaultParameters,
    filterText: state.sampleGrid.filterText,
  };
}


function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleList()),
    filter: (filterText) => dispatch(filterAction(filterText)),
    syncSamples: (proposalId) => dispatch(sendSyncSamples(proposalId)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    selectSamples: (keys, selected) => dispatch(selectSamplesAction(keys, selected)),
    deleteSamplesFromQueue: (sampleID) => dispatch(deleteSamplesFromQueue(sampleID)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSamplesToQueue: (sampleData) => dispatch(addSamplesToQueue(sampleData)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridViewContainer);

