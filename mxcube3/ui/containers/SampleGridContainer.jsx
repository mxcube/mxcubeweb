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
  Tooltip
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
  addSample
} from '../actions/queue';

import { showTaskForm } from '../actions/taskForm';
import SampleGrid from '../components/SampleGrid/SampleGrid';
import { SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';
import '../components/SampleGrid/SampleGrid.css';


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
    this.showAddSampleForm = this.props.showTaskParametersForm.bind(this, 'AddSample');
    this.showCharacterisationForm = this.handleSubmit.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.handleSubmit.bind(this, 'DataCollection');
    this.onClick = this.onClick.bind(this);
  }


  componentDidMount() {
    document.addEventListener('click', this.onClick, false);
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.queue.queue !== this.props.queue.queue) {
      this.props.setSampleOrderAction(nextProps.order);
    }
  }


  onClick(e) {
    let res = true;

    if (e.target.className === 'samples-grid-item-tasks' && e.button === 2) {
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
    const parameters = { parameters:
                         { ...this.props.defaultParameters[formName.toLowerCase()] }
                       };

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
      proposalId = this.props.loginData.session.proposalId;
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


  render() {
    const gridWidth = this.calcGridWidth();
    const innerSearchIcon = (
      <DropdownButton title="" id="filter-drop-down">
        <MenuItem onClick={this.filterSampleGridClear}>
          Clear
        </MenuItem>
        <MenuItem onClick={this.filterSampleGridPicked}>
          Picked
        </MenuItem>
      </DropdownButton>
    );

    return (
      <StickyContainer>
        <ul id="contextMenu" style={{ display: 'none' }} className="dropdown-menu" role="menu">
          <MenuItem header> <span><Glyphicon glyph="plus" /> Add </span></MenuItem>
          <MenuItem eventKey="1" onClick={this.addSelectedSamples}>
            Sample
          </MenuItem>
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
            </ButtonToolbar>
          </div>
        </div>
        <Sticky
          className="samples-grid-header"
          style={{ width: gridWidth, marginBottom: '5px' }}
          stickyStyle={{ padding: '10px' }}
        >
          <div className="row">
            <div className="col-xs-9">
              <div className="form-inline">
                <OverlayTrigger
                  placement="top"
                  overlay={(<Tooltip>Select samples</Tooltip>)}
                >
                  <DropdownButton
                    bsStyle="default"
                    title={<span><Glyphicon glyph="unchecked" /></span>}
                    id="pipeline-mode-dropdown"
                  >
                    <MenuItem eventKey="1" onClick={this.selectAllSamples}>
                      All
                    </MenuItem>
                    <MenuItem eventKey="1" onClick={this.selectAllSamples}>
                      None
                    </MenuItem>
                    <MenuItem eventKey="1" onClick={this.selectAllSamples}>
                      Un-collected
                    </MenuItem>
                  </DropdownButton>
                </OverlayTrigger>
                <span style={{ marginLeft: '1em' }} ></span>
                <OverlayTrigger
                  placement="top"
                  overlay={(<Tooltip>Add Tasks</Tooltip>)}
                >
                  <DropdownButton
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
                  overlay={(<Tooltip>Remove Tasks</Tooltip>)}
                >
                  <DropdownButton
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
                <span style={{ marginLeft: '5em' }} >Grid size: </span>
                <ButtonGroup>
                  <Button>S</Button>
                  <Button>M</Button>
                  <Button>L</Button>
                </ButtonGroup>
                <span style={{ marginLeft: '5em' }} ></span>
              </div>
             </div>
             <div className="col-xs-2 pull-right">
               <Button
                 className="btn btn-success pull-right"
                 href="#/datacollection"
                 disabled={this.isCollectDisabled()}
               >
                 Collect {this.numSamplesPicked()}/{this.numSamples()}
                 <Glyphicon glyph="chevron-right" />
               </Button>
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
    selectSamples: (keys) => dispatch(selectAction(keys)),
    toggleSelectedSample: (keys) => dispatch(toggleSelectedAction(keys)),
    deleteSample: (sampleID) => dispatch(deleteSample(sampleID)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSample: (sampleData) => dispatch(addSample(sampleData)),
    showSampleGridContextMenu: bindActionCreators(showSampleGridContextMenu, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

