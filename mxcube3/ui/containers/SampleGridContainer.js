import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import SampleGrid from '../components/SampleGrid/SampleGrid';
import { Input, Button, Glyphicon, ButtonToolbar, SplitButton, MenuItem } from 'react-bootstrap';
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll, doFilter, doSyncSamples, sendManualMount, doUnselectAll, sendDeleteSampleTask } from '../actions/samples_grid';
import { sendAddSample } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';
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
    Object.keys(this.props.samples_list).forEach(key => {

      if (this.props.selected[key]) {
        this.props.addSampleToQueue(key);
      }

    });
    this.props.unselectAll();
  }

  syncSamples() {
    try {
      var proposal_id = this.props.login_data.session.proposalId;
    } catch (e) {
      return;
    }

    this.props.syncSamples(proposal_id);
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

    return (<div className="row">
            <div className="navbar-default col-xs-12" style={{ position: 'fixed', zIndex:1, paddingTop: 11, marginTop: -12 }} >
              <div className="row">
                <div className="col-xs-4">
                    <div className="form-horizontal">
                        <Input type="text" ref="filter_input" defaultValue={this.props.filter_text} label="Filter" labelClassName="col-xs-2" wrapperClassName="col-xs-9" buttonAfter={innerSearchIcon} onChange={this.filterSampleGrid} />
                    </div>
                </div>
                <div className={"col-xs-4"} >
                  <ButtonToolbar>
                    <SplitButton bsStyle="primary" pullRight title={this.props.manualMount ? 'Manual Mount' : 'Check sample changer contents'} onClick={this.props.manualMount ? this.showAddSample : this.props.getSamples} onSelect={this.manualMount} id="split-button-sample-changer-selection">
                      <MenuItem eventKey="1">{this.props.manualMount ? 'Sample changer' : 'Manual mount'}</MenuItem>
                    </SplitButton>
                    <Button className="btn-primary" disabled={this.props.manualMount} onClick={this.syncSamples}>
                      <Glyphicon glyph="refresh" /> Sync. ISPyB
                    </Button>
                  </ButtonToolbar>
                </div>
                <div className="col-xs-4">
                  <ButtonToolbar>
                    <Button className="btn-success pull-right" onClick={this.addSamples} disabled={this.props.manualMount}>
                      <Glyphicon glyph="plus" /> Add To Queue
                    </Button>
                    <Button className="btn pull-right" onClick={this.props.unselectAll} disabled={this.props.manualMount}>Unselect all</Button>
                    <Button className="btn pull-right" onClick={this.props.selectAll} disabled={this.props.manualMount}>Select all</Button>
                  </ButtonToolbar>
                </div>
              </div>
                <div className="row">
                  <div className="col-xs-12">
                      <SampleTaskButtons defaultParameters={this.props.defaultParameters} showForm={this.props.showTaskParametersForm} selected={this.props.selected} />
                  </div>
               </div>
            </div>
              <div className="col-xs-12" style={{ paddingTop: 103 }}>
                  <SampleGrid samples_list={this.props.samples_list} selected={this.props.selected} toggleSelected={this.props.toggleSelected} filter_text={this.props.filter_text} queue={this.props.queue} showTaskParametersForm={this.props.showTaskParametersForm} deleteTask={this.props.deleteTask} />
              </div>
          </div>);
  }
}

function mapStateToProps(state) {
  return {
    login_data: state.login.data,
    queue : state.queue,
    selected : state.samples_grid.selected,
    samples_list: state.samples_grid.samples_list,
    defaultParameters: state.taskForm.defaultParameters,
    manualMount : state.samples_grid.manualMount.set,
    filter_text : state.samples_grid.filter_text
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(doGetSamplesList()),
    toggleSelected: (index) => dispatch(doToggleSelected(index)),
    selectAll: () => dispatch(doSelectAll()),
    unselectAll: () => dispatch(doUnselectAll()),
    filter: (filter_text) => dispatch(doFilter(filter_text)),
    syncSamples: (proposal_id) => dispatch(doSyncSamples(proposal_id)),
    addSampleToQueue: (id) => dispatch(sendAddSample(id)),
    sendManualMount: (manual) => dispatch(sendManualMount(manual)),
    updateSamples: (samples_list) => dispatch(doUpdateSamples(samples_list)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: (parent_id, queue_id, sample_id) => dispatch(sendDeleteSampleTask(parent_id, queue_id, sample_id))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

