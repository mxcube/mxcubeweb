import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueue from '../components/General/SampleQueue';
import * as QueueActions from '../actions/queue'

class SampleQueueContainer extends Component {

    
  render() {
    return (
      <div className="row">
      <div className="col-xs-12">
        <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">SampleQueue</h8>
                </div>
                <div className="panel-body">
                {this.props.todo.map((result,index) => {
                      return <SampleQueue key={index} sampledata={this.props.samples_list[result]}/>;
                  })}
                </div>
              </div>
            </div>
      </div>
    )
  }
}


function mapStateToProps(state) {
  return {

    todo: state.queue.todo,
    samples_list: state.samples_grid.samples_list
    
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

