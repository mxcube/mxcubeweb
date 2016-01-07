import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueue from '../components/SampleQueue/SampleQueue';
import SampleQueueButtons from '../components/SampleQueue/SampleQueueButtons';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import { showForm } from '../actions/methodForm'


class SampleQueueContainer extends Component {

    
  render() {

    const {selected, checked, lookup, tree, showForm} = this.props;
    const {toggleCheckBox, sendChangeOrder, sendDeleteSample } = this.props.queueActions;


    return (


      <div className="row">
            <div className="col-xs-12">
                <SampleQueue tree={tree} selected={selected} data={this.props} showForm={showForm} changeOrder={this.props.queueActions.sendChangeOrder} toggleCheckBox={toggleCheckBox}/>;
                <SampleQueueButtons showForm={showForm} addMethod={this.props.sampleActions.sendAddSampleMethod} selected={selected} checked={checked} lookup={lookup}/>
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {
  // Creating the tree structure for the queue list
  let samples = [];
  state.queue.todo.map((queue_id) => {

    const sampleData = state.samples_grid.samples_list[state.queue.lookup[queue_id]];
    samples.push({
      module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
      queue_id: queue_id,
      sample_id: sampleData.id,
      method: false,
      leaf: true,
      type: "Sample",
      children :  (sampleData.methods ? sampleData.methods.map( (method,index) =>{
        return {
                module: method.name,
                method: true,
                leaf: true,
                list_index: index,
                sample_id: sampleData.id,
                queue_id: method.queue_id,
                parent_id: queue_id,
                type: "Method"
        };
      } 
        ) : [])
    });
  });

  let tree = {
  module: 'Sample Queue - TODO',
  children: samples,
  method: false,
  root: true,
  type: "Root"
  };


  return { 
          tree: tree,
          selected: state.queue.selected,
          checked: state.queue.checked,
          sample_list: state.samples_grid.samples_list,
          checked: state.queue.checked,
          lookup: state.queue.lookup,
          select_all: state.queue.selectAll
    }
}

function mapDispatchToProps(dispatch) {
 return {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    showForm : bindActionCreators(showForm, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleQueueContainer)