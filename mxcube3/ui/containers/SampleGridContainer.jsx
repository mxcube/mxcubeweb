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
  ButtonGroup
} from 'react-bootstrap';

import {
  toggleSelectedAction,
  pickAllAction,
  filterAction,
  toggleMovableAction,
  selectAction,
  pickSamplesAction
} from '../actions/SamplesGrid';

import {
  sendGetSampleList,
  sendSyncSamples,
  sendManualMount,
  setSampleOrderAction,
  sendAddSample,
  sendDeleteSampleTask,
} from '../actions/queue';


import { showTaskForm } from '../actions/taskForm';
import SampleTaskButtons from '../components/SampleGrid/TaskButtons';

import SampleGrid from '../components/SampleGrid/SampleGrid';
import { SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';
import '../components/SampleGrid/SampleGrid.css';


class SampleGridContainer extends React.Component {

  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);

    this.showAddSample = props.showTaskParametersForm.bind(this, 'AddSample');
    this.manualMount = this.manualMount.bind(this);
    this.filterSampleGrid = this.filterSampleGrid.bind(this);
    this.filterSampleGridClear = this.filterSampleGridClear.bind(this);
    this.filterSampleGridPicked = this.filterSampleGridPicked.bind(this);
    this.pickSelectedSamples = this.pickSelectedSamples.bind(this);
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
    return Object.values(this.props.picked).filter(value => value === true).length;
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


  pickSelectedSamples() {
    const keys = Object.assign({}, this.props.selected, this.props.picked);
    this.props.pickSamplesAction(this.props.selected);
    this.props.setSampleOrderAction(this.props.order, keys);
  }


  render() {
    const gridWidth = this.calcGridWidth();
    const innerSearchIcon = (
      <DropdownButton>
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
        <div style={{ 'margin-bottom': '20px' }} className="row row-centered">
          <div className="col-centered" >
            <ButtonToolbar>
              <SplitButton
                bsStyle="primary"
                title={this.props.manualMount ? 'Manual Mount' : 'Check sample changer contents'}
                onClick={this.props.manualMount ? this.showAddSample : this.props.getSamples}
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
          style={{ width: gridWidth, 'margin-bottom': '5px' }}
          stickyStyle={{ padding: '10px' }}
        >
          <div className="row">
            <div className="col-xs-6">
              <div className="form-inline">
                <span>Pick for collect: </span>
                <ButtonGroup>
                  <Button
                    onClick={this.props.selectAll}
                    disabled={this.props.manualMount}
                  >
                  All
                  </Button>
                  <Button
                    onClick={this.pickSelectedSamples}
                    disabled={this.props.manualMount}
                  >
                    Selected
                  </Button>
                  <Button
                    onClick={this.props.unselectAll}
                    disabled={this.props.manualMount}
                  >
                    None
                  </Button>
                </ButtonGroup>
                <span style={{ 'margin-left': '5em' }}>Filter: </span>
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
               <SampleTaskButtons
                 defaultParameters={this.props.defaultParameters}
                 showForm={this.props.showTaskParametersForm}
                 selected={this.props.selected}
               />
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
              toggleSelected={this.props.toggleSelected}
              filterText={this.props.filterText}
              queue={this.props.queue}
              showTaskParametersForm={this.props.showTaskParametersForm}
              deleteTask={this.props.deleteTask}
              toggleMovable={this.props.toggleMovableAction}
              moving={this.props.moving}
              gridWidth={gridWidth}
              picked={this.props.picked}
              select={this.props.select}
              pickSelected={this.pickSelectedSamples}
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
    picked: state.sampleGrid.picked
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleList()),
    setSampleOrderAction: (order, picked) => dispatch(setSampleOrderAction(order, picked)),
    toggleSelected: (index) => dispatch(toggleSelectedAction(index)),
    selectAll: () => dispatch(pickAllAction(true)),
    unselectAll: () => dispatch(pickAllAction(false)),
    filter: (filterText) => dispatch(filterAction(filterText)),
    syncSamples: (proposalId) => dispatch(sendSyncSamples(proposalId)),
    addSampleToQueue: (id) => dispatch(sendAddSample(id)),
    setManualMount: (manual) => dispatch(sendManualMount(manual)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: bindActionCreators(sendDeleteSampleTask, dispatch),
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    select: (keys) => dispatch(selectAction(keys)),
    pickSamplesAction: (keys) => dispatch(pickSamplesAction(keys))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

