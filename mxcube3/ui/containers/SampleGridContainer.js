import React from 'react'
import { connect } from 'react-redux'
import SampleGrid from '../components/SampleGrid/SampleGrid'
import { Input, Button, Glyphicon, ButtonToolbar, SplitButton, MenuItem  } from "react-bootstrap"
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll, doFilter, doSyncSamples, doToggleManualMount, doUnselectAll, showTaskParametersForm, sendDeleteSampleTask } from '../actions/samples_grid'
import { sendAddSample } from '../actions/queue'
import TaskContainer from '../containers/TaskContainer'

class SampleGridContainer extends React.Component {
        addSamples() {
            // Loop through all samples, check which was selected and add to the queue. 
            Object.keys(this.props.samples_list).forEach(key => {

                if (this.props.selected[key]){
                  this.props.addSampleToQueue(key);
                }
               
            });
            this.props.unselectAll();
        }

        syncSamples() {
            try {
                var proposal_id = this.props.login_data.session.proposalId;
            } catch(e) {
                return
            } 
            
            this.props.syncSamples(proposal_id);
        }

        render() {
          const innerSearchIcon = (
            <Button onClick={() => { this.props.filter(this.refs.filter_input.getValue()) } }><Glyphicon glyph="search"/></Button>
          );
      
          return (<div className="row">
            <div className="navbar-default col-xs-12" style={{position: 'fixed', zIndex:1, padding: 10}}>
              <div className="row">
                <div className="col-xs-3">
                    <form className="form-horizontal">
                        <Input type="text" ref="filter_input" defaultValue={this.props.filter_text} label="Filter" labelClassName="col-xs-2" wrapperClassName="col-xs-9" buttonAfter={innerSearchIcon} onKeyPress={(target)=> { if (target.charCode==13) { this.props.filter(this.refs.filter_input.getValue()) }}}/>
                    </form>
                </div>
                <div className="col-xs-4">
                  <ButtonToolbar>
                    <SplitButton bsStyle="primary" pullRight={true} title={this.props.manual_mount ? "Manual mount" : "Check sample changer contents"} onClick={this.props.manual_mount ? undefined : this.props.getSamples} onSelect={this.props.toggleManualMount} id="split-button-sample-changer-selection">
                      <MenuItem eventKey="1">{this.props.manual_mount ? "Sample changer" : "Manual mount"}</MenuItem>
                    </SplitButton>
                    <Button className="btn-primary" disabled={this.props.manual_mount ? true : false } onClick={ ()=> { this.syncSamples() }}>
                      <Glyphicon glyph="refresh" /> Sync. ISPyB
                    </Button>
                  </ButtonToolbar>
                </div>
                <div className="col-xs-3">
                  <ButtonToolbar>
                    <Button className="btn-success pull-right" onClick={()=> { this.addSamples() }}>
                      <Glyphicon glyph="plus" /> Add samples
                    </Button>
                    <Button className="btn pull-right" onClick={this.props.unselectAll}>Unselect all</Button>
                    <Button className="btn pull-right" onClick={this.props.selectAll}>Select all</Button>
                  </ButtonToolbar>
                </div>
              </div>
                <div className="row">
                  <div className="col-xs-12">
                      <TaskContainer/>
                  </div>
               </div>
            </div>
            <div className="row" style={{paddingTop: 103, paddingLeft: 20}}>
              <div className="col-xs-12">
                  <SampleGrid samples_list={this.props.samples_list} selected={this.props.selected} toggleSelected={this.props.toggleSelected} filter_text={this.props.filter_text} queue={this.props.queue} showTaskParametersForm={this.props.showTaskParametersForm} deleteTask={this.props.deleteTask}/>
              </div>
            </div>
          </div>)
        }
}

function mapStateToProps(state) {
    return Object.assign({}, state.samples_grid, { login_data: state.login.data }, {queue : state.queue})
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
        toggleManualMount: (manual) => dispatch(doToggleManualMount(manual)),
        updateSamples: (samples_list) => dispatch(doUpdateSamples(samples_list)),
        showTaskParametersForm: (task_name, task) => dispatch(showTaskParametersForm(task_name, task)),
        deleteTask: (parent_id, queue_id, sample_id) => dispatch(sendDeleteSampleTask(parent_id, queue_id, sample_id))
    }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer)

