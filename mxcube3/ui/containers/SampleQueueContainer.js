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

    const {selected, checked, lookup, todo_tree, history_tree, showForm, current_tree, current} = this.props;
    const {toggleCheckBox, sendChangeOrder, sendDeleteSample, finishSample, runSample, selectSample} = this.props.queueActions;

    return (


      <div className="row">
            <div className="col-xs-12 queue">
                <SampleQueue current={current} todo_tree={todo_tree} history_tree={history_tree} current_tree={current_tree} select={selectSample} run={runSample} finishSample={finishSample} selected={selected} data={this.props} showForm={showForm} changeOrder={sendChangeOrder} toggleCheckBox={toggleCheckBox}/>;
                <SampleQueueButtons showForm={showForm} addMethod={this.props.sampleActions.sendAddSampleMethod} selected={selected} checked={checked} lookup={lookup}/>
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {

  // Creating the tree structure for the current sample
  let current_tree = {};
  if(state.queue.current){

    const currentData = state.samples_grid.samples_list[state.queue.lookup[state.queue.current]];

    current_tree = {
      module: 'Current Sample - Vial ' + currentData.id,
      queue_id: state.queue.current,
      sample_id: currentData.id,
      root: true,
      type: "Root",
      children :  (currentData.methods ? currentData.methods.map( (method,index) =>{
        return {
          module: method.name,
          method: true,
          leaf: true,
          finished: false,
          list_index: index,
          sample_id: currentData.id,
          queue_id: method.queue_id,
          parent_id: state.queue.current,
          type: "Method"
        };
      } ) : [])

    };

  }else{
    current_tree ={
      module: 'Current Sample - None',
      children: (state.queue.current ? [currentSample] : []),
      method: false,
      root: true,
      type: "Root"
    };
  }


  // Creating the tree structure for the queue todo-list
  let samples_todo = [];
  state.queue.todo.map((queue_id) => {

    const sampleData = state.samples_grid.samples_list[state.queue.lookup[queue_id]];

    if(state.queue.searchString === "" || sampleData.id.indexOf(state.queue.searchString) > -1 ){
      samples_todo.push({
        module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
        queue_id: queue_id,
        sample_id: sampleData.id,
        method: false,
        leaf: false,
        finished: false,
        type: "Sample",
        children :  (sampleData.methods ? sampleData.methods.map( (method,index) =>{
          return {
            module: method.name,
            method: true,
            leaf: true,
            finished: false,
            list_index: index,
            sample_id: sampleData.id,
            queue_id: method.queue_id,
            parent_id: queue_id,
            type: "Method"
          };
        } 
        ) : [])
      });

    }

  });

  let todo_tree = {
  module: 'Sample Queue - TODO',
  children: samples_todo,
  method: false,
  root: true,
  type: "Root"
  };

  // Creating the tree structure for the queue History-list
  let samples_history = [];
  state.queue.history.map((queue_id) => {

    const sampleData = state.samples_grid.samples_list[state.queue.lookup[queue_id]];
    samples_history.push({
      module: 'Vial ' + sampleData.id + " " + sampleData.proteinAcronym,
      queue_id: queue_id,
      sample_id: sampleData.id,
      method: false,
      leaf: false,
      finished: true,
      type: "Sample",
      children :  (sampleData.methods ? sampleData.methods.map( (method,index) =>{
        return {
                module: method.name,
                method: true,
                leaf: true,
                finished: true,
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

  let history_tree = {
  module: 'Sample Queue - HISTORY',
  children: samples_history,
  method: false,
  root: true,
  type: "Root"
  };

  // Getting information about the current running sample
  let current = false;
  if (state.queue.current){
    current = state.samples_grid.samples_list[state.queue.lookup[state.queue.current]];
    current.queue_id = state.queue.current;
  }
  return { 
          current : current,
          current_tree: current_tree,
          todo_tree: todo_tree,
          history_tree: history_tree,
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