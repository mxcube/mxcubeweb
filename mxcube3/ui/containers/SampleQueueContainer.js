import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueue from '../components/General/SampleQueue';
import * as QueueActions from '../actions/queue'

class SampleQueueContainer extends Component {

  addSample(){
    this.props.actions.addSample("Add Characterisation");
  }
    
  render() {

    return (
      <div className="row">
      <div className="col-xs-12">
        <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">SampleQueue</h8>
                </div>
                <div className="panel-body">
                <ul>
                {this.props.todo.map((function(result,index) {
                      return <SampleQueue key={index} data={result} addSample={this.props.actions.addSample} />;
                  }.bind(this)))}
                </ul>
                <a className='btn btn-primary'onClick={this.addSample.bind(this)}>Add Sample</a>
                </div>
              </div>
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {
  return {

    todo: state.queue.todo
    
  }
}

function mapDispatchToProps(dispatch) {
 return {
    actions: bindActionCreators(QueueActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleQueueContainer)