import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Input, Button, Glyphicon, ButtonToolbar, SplitButton, MenuItem,
         PanelGroup, Panel } from 'react-bootstrap';
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll, doFilter, doSyncSamples,
         sendManualMount, doUnselectAll, sendDeleteSampleTask } from '../actions/SamplesGrid';

import { sendAddSample } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';

import SampleGrid from '../components/SampleGrid/SampleGrid';
import SampleTaskButtons from '../components/SampleGrid/TaskButtons';


class SampleGridContainer extends React.Component {

  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);
    this.addSamples = this.addSamples.bind(this);
    this.showAddSample = props.showTaskParametersForm.bind(this, 'AddSample');
    this.manualMount = this.manualMount.bind(this);
    this.filterSampleGrid = this.filterSampleGrid.bind(this);
  }


  addSamples() {
    // Loop through all samples, check which was selected and add to the queue.
    Object.keys(this.props.samplesList).forEach(key => {
      if (this.props.selected[key]) {
        this.props.addSampleToQueue(key);
      }
    });
    this.props.unselectAll();
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
    this.props.sendManualMount(!this.props.manualMount);
  }


  filterSampleGrid(option) {
    this.props.filter(option.target.value);
  }


  render() {
    const innerSearchIcon = (
      <Button><Glyphicon glyph="search" /></Button>
    );

    const panelHeader = (
     <div> Pipline mode <Glyphicon className="pull-right" glyph="chevron-down" /></div>
   );

    return (
      <div>
        <div className="row row-centered">
          <div className={"col-centered"} >
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
        <div className="row">
          <div className="col-xs-4">
            <ButtonToolbar>
              <Button
                className="btn"
                onClick={this.props.unselectAll}
                disabled={this.props.manualMount}
              >
                Unselect all
              </Button>
              <Button
                className="btn"
                onClick={this.props.selectAll}
                disabled={this.props.manualMount}
              >
                Select all
              </Button>
            </ButtonToolbar>
          </div>
          <div className="col-xs-7">
            <div className="form-horizontal pull-right">
              <Input
                type="text"
                ref="filter_input"
                defaultValue={this.props.filterText}
                label="Filter:"
                labelClassName="col-xs-2"
                wrapperClassName="col-xs-10"
                buttonAfter={innerSearchIcon}
                onChange={this.filterSampleGrid}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <SampleGrid
              samples_list={this.props.samplesList}
              selected={this.props.selected}
              toggleSelected={this.props.toggleSelected}
              filter_text={this.props.filterText}
              queue={this.props.queue}
              showTaskParametersForm={this.props.showTaskParametersForm}
              deleteTask={this.props.deleteTask}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-xs-6">
            <PanelGroup accordion>
              <Panel header={panelHeader}>
                <SampleTaskButtons
                  defaultParameters={this.props.defaultParameters}
                  showForm={this.props.showTaskParametersForm}
                  selected={this.props.selected}
                />
              </Panel>
            </PanelGroup>
          </div>
          <div className="col-xs-5">
            <Button className="btn btn-success pull-right" href="#/datacollection">
              Collect <Glyphicon glyph="chevron-right" />
            </Button>
          </div>
        </div>
      </div>);
  }
}

function mapStateToProps(state) {
  return {
    loginData: state.login.data,
    queue: state.queue,
    selected: state.samples_grid.selected,
    samplesList: state.samples_grid.samples_list,
    defaultParameters: state.taskForm.defaultParameters,
    manualMount: state.samples_grid.manualMount.set,
    filterText: state.samples_grid.filter_text
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(doGetSamplesList()),
    toggleSelected: (index) => dispatch(doToggleSelected(index)),
    selectAll: () => dispatch(doSelectAll()),
    unselectAll: () => dispatch(doUnselectAll()),
    filter: (filterText) => dispatch(doFilter(filterText)),
    syncSamples: (proposalId) => dispatch(doSyncSamples(proposalId)),
    addSampleToQueue: (id) => dispatch(sendAddSample(id)),
    sendManualMount: (manual) => dispatch(sendManualMount(manual)),
    updateSamples: (samplesList) => dispatch(doUpdateSamples(samplesList)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: (parentId, queueId, sampleId) => {
      dispatch(sendDeleteSampleTask(parentId, queueId, sampleId));
    }
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

