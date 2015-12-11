import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueue from '../components/SampleQueue/SampleQueue';
import SampleQueueButtons from '../components/SampleQueue/SampleQueueButtons';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'


class SampleQueueContainer extends Component {

    
  render() {
    const selected = this.props.selected;
    return (


      <div className="row">
            <div className="col-xs-12">
                <SampleQueue data={this.props}/>;
                <SampleQueueButtons addMethod={this.props.sampleActions.sendSampleMethod.bind(this,selected.queue_id, selected.sample_id)} />
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {

  let samples = [];
  state.queue.todo.map((sample,index) => {

    const sampleData = state.samples_grid.samples_list[sample.sample_id];

    let list_methods = (sampleData.methods ? sampleData.methods.map( (method) =>{ return {module: "Centring"}; } ) : []);

    samples.push({
      module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
      queue_id: sample.queue_id,
      sample_id: sample.sample_id,
      list_index: index,
      children :  (sampleData.methods ? sampleData.methods.map( (method) =>{
        return {module: method.name};
      } 
        ) : [])
    });
  });

  let tree = {
  module: 'Sample Queue - TODO',
  children: samples,
  root: true
  };


  return { 
          tree: tree,
          selected: state.queue.selected
    }
}

function mapDispatchToProps(dispatch) {
 return {
    actions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleQueueContainer)