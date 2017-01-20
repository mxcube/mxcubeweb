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

import {
  sendGetSampleList,
  sendSyncSamples,
  filterAction,
  toggleMovableAction,
  selectSamplesAction,
  toggleSelectedAction,
  setSampleOrderAction,
} from '../actions/sampleGrid';

import {
  deleteTask,
  sendClearQueue,
  deleteSamplesFromQueue,
  addSamplesToQueue
} from '../actions/queue';

import { showTaskForm } from '../actions/taskForm';
import SampleGrid from '../components/SampleGrid/SampleGrid';
import { SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';
import '../components/SampleGrid/SampleGrid.css';
import { QUEUE_RUNNING } from '../constants';

class SampleGridContainer extends React.Component {

  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);

    this.filterSampleGrid = this.filterSampleGrid.bind(this);
    this.filterSampleGridClear = this.filterSampleGridClear.bind(this);
    this.filterSampleGridPicked = this.filterSampleGridPicked.bind(this);
    this.addSelectedSamples = this.addSelectedSamples.bind(this);
    this.toggleAddDeleteSelectedSamples = this.toggleAddDeleteSelectedSamples.bind(this);
    this.removeSelectedSamples = this.removeSelectedSamples.bind(this);
    this.removeAllSamples = this.removeAllSamples.bind(this);
    this.selectAllSamples = this.selectAllSamples.bind(this);
    this.clearSelectedSamples = this.clearSelectedSamples.bind(this);
    this.showCharacterisationForm = this.handleSubmit.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.handleSubmit.bind(this, 'DataCollection');
    this.showAddSampleForm = this.handleSubmit.bind(this, 'AddSample');
    this.onClick = this.onClick.bind(this);
    this.collectButton = this.collectButton.bind(this);
    this.startCollect = this.startCollect.bind(this);
    this.picked = this.picked.bind(this);
  }

  componentDidMount() {
    document.addEventListener('click', this.onClick, false);
  }

  componentWillUnmount() {
    // Important to remove listener if component isn't active
    document.removeEventListener('click', this.onClick);
  }

  onClick(e) {
    let res = true;

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      document.getElementById('contextMenu').style.display = 'none';
    } else if (e.target.className.indexOf('samples-grid-item') > -1 && e.button === 2) {
      document.getElementById('contextMenu').style.top = `${e.clientY - 2}px`;
      document.getElementById('contextMenu').style.left = `${e.clientX - 65}px`;
      document.getElementById('contextMenu').style.display = 'block';
      res = false;
    } else {
      document.getElementById('contextMenu').style.display = 'none';
    }

    return res;
  }


  handleSubmit(formName) {
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


  syncSamples() {
    let proposalId;

    try {
      proposalId = this.props.loginData.Proposal.proposalId;
    } catch (e) {
      return;
    }

    this.props.syncSamples(proposalId);
  }


  filterSampleGrid() {
    this.props.filter(this.refs.filterInput.getInputDOMNode().value.trim());
  }


  filterSampleGridClear() {
    this.refs.filterInput.getInputDOMNode().value = '';
    this.filterSampleGrid();
  }


  filterSampleGridPicked() {
    this.refs.filterInput.getInputDOMNode().value = 'is:picked';
    this.filterSampleGrid();
  }


  numSamplesPicked() {
    return Object.keys(this.props.queue.queue).length;
  }


  isCollectDisabled() {
    return this.numSamplesPicked() === 0;
  }


  numSamples() {
    return Object.keys(this.props.sampleList).length;
  }


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

    return actualGridWidth;
  }


  selectAllSamples() {
    this.props.selectSamples(Object.keys(this.props.sampleList));
  }


  clearSelectedSamples() {
    this.props.selectSamples(Object.keys(this.props.sampleList), false);
  }


  picked(sampleID) {
    return this.props.queue.queue.includes(sampleID);
  }

  toggleAddDeleteSelectedSamples() {
    const samples = [];
    for (const sampleID in this.props.selected) {
      if (this.picked(sampleID)) {
        this.props.deleteSamplesFromQueue([sampleID]);
      } else {
        samples.push({ ...this.props.sampleList[sampleID], checked: true, tasks: [] });
      }
    }
    if (samples.length > 0) { this.props.addSamplesToQueue(samples); }
  }


  addSelectedSamples() {
    const samples = [];
    for (const sampleID of Object.keys(this.props.selected)) {
      samples.push({ ...this.props.sampleList[sampleID], checked: true, tasks: [] });
    }
    this.props.addSamplesToQueue(samples);
  }


  removeSelectedSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.picked(sampleID)) {
        this.props.deleteSamplesFromQueue([sampleID]);
      }
    }
  }


  removeAllSamples() {
    for (const sampleID of Object.keys(this.props.queue.queue)) {
      this.props.deleteSamplesFromQueue([sampleID]);
    }
  }


  startCollect() {
    window.location = '#/datacollection';
  }


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
    const gridWidth = this.calcGridWidth();
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
        <ul id="contextMenu" style={{ display: 'none' }} className="dropdown-menu" role="menu">
          <MenuItem eventKey="1" onClick={this.addSelectedSamples}>
            <span><Glyphicon glyph="unchecked" /> Pick Sample </span>
          </MenuItem>
          <MenuItem divider />
          <MenuItem header> <span><Glyphicon glyph="plus" /> Add </span></MenuItem>
          <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
            Data collection
          </MenuItem>
          <MenuItem eventKey="3" onClick={this.showCharacterisationForm}>
            Characterisation
          </MenuItem>
          <MenuItem divider />
          <MenuItem header><span><Glyphicon glyph="minus" /> Remove </span></MenuItem>
          <MenuItem eventKey="1" onClick={this.removeSelectedSamples}>
            Remove tasks
          </MenuItem>
        </ul>
        <Sticky
          className="samples-grid-header"
          style={{ transform: 'translateZ(1)', width: gridWidth, marginBottom: '5px' }}
          stickyStyle={{ padding: '10px' }}
        >
          <div className="row">
            <div style={{ paddingLeft: '0px' }} className="col-xs-10">
              <div className="form-inline">
                <SplitButton
                  disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                  title={'Create new sample'}
                  id="split-button-sample-changer-selection"
                  onClick={this.showAddSampleForm}
                >
                  <MenuItem eventKey="2" onClick={this.props.getSamples}>
                    Get samples from SC
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
                <Input
                  type="text"
                  ref="filterInput"
                  defaultValue={this.props.filterText}
                  buttonAfter={innerSearchIcon}
                  onChange={this.filterSampleGrid}
                />
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
                  onClick={this.addSelectedSamples}
                  bsStyle="default"
                  title={<span><Glyphicon glyph="plus" /> Add to queue</span>}
                  id="pipeline-mode-dropdown"
                >
                  <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
                    Data collection
                  </MenuItem>
                  <MenuItem eventKey="3" onClick={this.showCharacterisationForm}>
                    Characterisation
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
            <SampleGrid
              sampleList={this.props.sampleList}
              order={this.props.order}
              setSampleOrder={this.props.setSampleOrderAction}
              selected={this.props.selected}
              filterText={this.props.filterText}
              queue={this.props.queue}
              showTaskParametersForm={this.props.showTaskParametersForm}
              deleteTask={this.props.deleteTask}
              toggleMovable={this.props.toggleMovableAction}
              moving={this.props.moving}
              gridWidth={gridWidth}
              select={this.props.selectSamples}
              pickSelected={this.toggleAddDeleteSelectedSamples}
              toggleSelectedSample={this.props.toggleSelectedSample}
              queueGUI={this.props.queueGUI}
            />
          </div>
        </div>
      </StickyContainer>);
  }
}

function mapStateToProps(state) {
  return {
    loginData: state.login.data,
    queue: state.queue,
    queueGUI: state.queueGUI,
    selected: state.sampleGrid.selected,
    moving: state.sampleGrid.moving,
    sampleList: state.sampleGrid.sampleList,
    defaultParameters: state.taskForm.defaultParameters,
    filterText: state.sampleGrid.filterText,
    order: state.sampleGrid.order,
    sampleGridContextMenu: state.sampleGrid.contextMenu
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleList()),
    setSampleOrderAction: (order) => dispatch(setSampleOrderAction(order)),
    filter: (filterText) => dispatch(filterAction(filterText)),
    syncSamples: (proposalId) => dispatch(sendSyncSamples(proposalId)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    selectSamples: (keys, selected) => dispatch(selectSamplesAction(keys, selected)),
    toggleSelectedSample: (keys) => dispatch(toggleSelectedAction(keys)),
    deleteSamplesFromQueue: (sampleID) => dispatch(deleteSamplesFromQueue(sampleID)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSamplesToQueue: (sampleData) => dispatch(addSamplesToQueue(sampleData)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

