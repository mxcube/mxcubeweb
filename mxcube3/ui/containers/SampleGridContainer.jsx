import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { StickyContainer, Sticky } from 'react-sticky';

import {
  Input,
  Button,
  Glyphicon,
  ButtonToolbar,
  SplitButton,
  DropdownButton,
  MenuItem,
  ButtonGroup,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';

import {
  filterAction,
  toggleMovableAction,
  selectAction,
  toggleSelectedAction,
  showSampleGridContextMenu
} from '../actions/SamplesGrid';

import {
  sendGetSampleList,
  sendSyncSamples,
  sendManualMount,
  setSampleOrderAction,
  deleteTask,
  deleteSample,
  sendClearQueue,
  addSample,
  sendRunQueue,
  setCurrentSample
} from '../actions/queue';

import { showTaskForm } from '../actions/taskForm';
import SampleGrid from '../components/SampleGrid/SampleGrid';
import { SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';
import '../components/SampleGrid/SampleGrid.css';

const QUEUE_STOPPED = 'QueueStopped';
const QUEUE_RUNNING = 'QueueStarted';


class SampleGridContainer extends React.Component {

  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);

    this.manualMount = this.manualMount.bind(this);
    this.filterSampleGrid = this.filterSampleGrid.bind(this);
    this.filterSampleGridClear = this.filterSampleGridClear.bind(this);
    this.filterSampleGridPicked = this.filterSampleGridPicked.bind(this);
    this.addSelectedSamples = this.addSelectedSamples.bind(this);
    this.toggleAddDeleteSelectedSamples = this.toggleAddDeleteSelectedSamples.bind(this);
    this.addAllSamples = this.addAllSamples.bind(this);
    this.removeSelectedSamples = this.removeSelectedSamples.bind(this);
    this.removeAllSamples = this.removeAllSamples.bind(this);
    this.selectAllSamples = this.selectAllSamples.bind(this);
    this.clearSelectedSamples = this.clearSelectedSamples.bind(this);
    this.showAddSampleForm = this.props.showTaskParametersForm.bind(this, 'AddSample');
    this.showCharacterisationForm = this.handleSubmit.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.handleSubmit.bind(this, 'DataCollection');
    this.onClick = this.onClick.bind(this);
    this.collectButton = this.collectButton.bind(this);
    this.headerContent = this.headerContent.bind(this);
    this.startCollect = this.startCollect.bind(this);
  }


  componentDidMount() {
    document.addEventListener('click', this.onClick, false);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.queue.queue !== this.props.queue.queue) {
      this.props.setSampleOrderAction(nextProps.order);
    }
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


  manualMount() {
    this.props.setManualMount(!this.props.manualMount);
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

  addSamples() {
    Object.keys(this.props.picked).forEach((sampleID) => {
      this.props.addSample(this.props.sampleList[sampleID]);
      return sampleID;
    });
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


  toggleAddDeleteSelectedSamples() {
    for (const sampleID in this.props.selected) {
      if (this.props.queue.queue[sampleID]) {
        this.props.deleteSample(sampleID);
      } else {
        this.props.addSample(this.props.sampleList[sampleID]);
      }
    }
  }


  addAllSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.props.queue.queue[sampleID]) {
        this.props.addSample(sampleID);
      }
    }
  }


  addSelectedSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      this.props.addSample(this.props.sampleList[sampleID]);
    }
  }


  removeSelectedSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.props.queue.queue[sampleID]) {
        this.props.deleteSample(sampleID);
      }
    }
  }


  removeAllSamples() {
    for (const sampleID of Object.keys(this.props.queue.queue)) {
      this.props.deleteSample(sampleID);
    }
  }


  startCollect() {
    if (!this.props.queue.manualMount.set) {
      this.props.setCurrentSample(this.props.queue.sampleOrder[0]);
      this.props.runQueue();
    }
    window.location = '#/datacollection';
  }


  collectButton() {
    let button = (
      <Button
        className="btn btn-success pull-right"
        onClick={this.startCollect}
        disabled={this.isCollectDisabled()}
      >
        Collect {this.numSamplesPicked()}/{this.numSamples()}
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


  headerContent() {
    let content = '';

    if (this.props.queue.queueStatus === QUEUE_STOPPED) {
      content = (
        <ButtonToolbar>
          <SplitButton
            bsStyle="primary"
            title={this.props.manualMount ? 'Manual Mount' : 'Check sample changer contents'}
            onClick={this.props.manualMount ? this.showAddSampleForm : this.props.getSamples}
            onSelect={this.manualMount}
            id="split-button-sample-changer-selection"
          >
            <MenuItem eventKey="1">
              {this.props.manualMount ? 'Sample changer' : 'Manual mount'}
            </MenuItem>
          </SplitButton>
          <Button
            className="btn-primary"
            disabled={this.props.manualMount}
            onClick={this.syncSamples}
          >
            <Glyphicon glyph="refresh" /> Sync. ISPyB
          </Button>
        </ButtonToolbar>);
    }

    return content;
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
        <div style={{ marginBottom: '20px' }} className="row row-centered">
          <div className="col-centered" >
            {this.headerContent()}
          </div>
        </div>
        <Sticky
          className="samples-grid-header"
          style={{ transform: 'translateZ(1)', width: gridWidth, marginBottom: '5px' }}
          stickyStyle={{ padding: '10px' }}
        >
          <div className="row">
            <div style={{ paddingLeft: '0px' }} className="col-xs-5">
              <div className="form-inline">
                <span >Select: </span>
                <OverlayTrigger
                  placement="top"
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
                <span style={{ marginLeft: '1em' }} ></span>
                <OverlayTrigger
                  placement="top"
                  overlay={(<Tooltip id="add-tasks">Add Tasks</Tooltip>)}
                >
                  <DropdownButton
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                    bsStyle="default"
                    title={<span><Glyphicon glyph="plus" /></span>}
                    id="pipeline-mode-dropdown"
                  >
                    <MenuItem eventKey="1" onClick={this.addSelectedSamples}>
                      Sample
                    </MenuItem>
                    <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
                      Data collection
                    </MenuItem>
                    <MenuItem eventKey="3" onClick={this.showCharacterisationForm}>
                      Characterisation
                    </MenuItem>
                  </DropdownButton>
                </OverlayTrigger>
                <span style={{ marginLeft: '1em' }} ></span>
                <OverlayTrigger
                  placement="top"
                  overlay={(<Tooltip id="remove-task">Remove Tasks</Tooltip>)}
                >
                  <DropdownButton
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                    bsStyle="default"
                    title={<span><Glyphicon glyph="minus" /></span>}
                    id="pipeline-mode-dropdown"
                  >
                    <MenuItem eventKey="1" onClick={this.removeAllSamples}>
                      All
                    </MenuItem>
                    <MenuItem eventKey="2" onClick={this.removeSelectedSamples}>
                      Selected
                    </MenuItem>
                  </DropdownButton>
                </OverlayTrigger>
                <span style={{ marginLeft: '5em' }}>Filter: </span>
                <Input
                  type="text"
                  ref="filterInput"
                  defaultValue={this.props.filterText}
                  buttonAfter={innerSearchIcon}
                  onChange={this.filterSampleGrid}
                />
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
              showSampleGridContextMenu={this.props.showSampleGridContextMenu}
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
    selected: state.sampleGrid.selected,
    moving: state.sampleGrid.moving,
    sampleList: state.queue.sampleList,
    defaultParameters: state.taskForm.defaultParameters,
    manualMount: state.queue.manualMount.set,
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
    setManualMount: (manual) => dispatch(sendManualMount(manual)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    selectSamples: (keys, selected) => dispatch(selectAction(keys, selected)),
    toggleSelectedSample: (keys) => dispatch(toggleSelectedAction(keys)),
    deleteSample: (sampleID) => dispatch(deleteSample(sampleID)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSample: (sampleData) => dispatch(addSample(sampleData)),
    showSampleGridContextMenu: bindActionCreators(showSampleGridContextMenu, dispatch),
    runQueue: () => dispatch(sendRunQueue()),
    setCurrentSample: (sampleID) => dispatch(setCurrentSample(sampleID))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

