import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueue from '../components/SampleQueue/SampleQueue';
import SampleQueueButtons from '../components/SampleQueue/SampleQueueButtons';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import * as FormActions from '../actions/methodForm'


class SampleQueueContainer extends Component {

    
  render() {
    const selected = this.props.selected;
    return (


      <div className="row">
            <div className="col-xs-12">
                <SampleQueue data={this.props} showForm={this.props.formActions.showForm}/>;
                <SampleQueueButtons showForm={this.props.formActions.showForm} addMethod={this.props.sampleActions.sendAddSampleMethod} selected={this.props.selected} />
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {

  // Creating the tree structure for the queue list
  let samples = [];
  state.queue.todo.map((sample,index) => {

    const sampleData = state.samples_grid.samples_list[sample.sample_id];

    samples.push({
      module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
      queue_id: sample.queue_id,
      sample_id: sample.sample_id,
      list_index: index,
      method: false,
      children :  (sampleData.methods ? sampleData.methods.map( (method,index) =>{
        return {
                module: method.name,
                method: true,
                leaf: true,
                list_index: index,
                sample_id: sample.sample_id,
                queue_id: method.queue_id,
                parent_id: sample.queue_id
        };
      } 
        ) : [])
    });
  });

  let tree = {
  module: 'Sample Queue - TODO',
  children: samples,
  method: false,
  root: true
  };


  return { 
          tree: tree,
          selected: state.queue.selected,
          sample_list: state.samples_grid.samples_list
    }
}

function mapDispatchToProps(dispatch) {
 return {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    formActions : bindActionCreators(FormActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleQueueContainer)