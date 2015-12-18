import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleImage from '../components/SampleView/SampleImage';
import * as QueueActions from '../actions/queue'

class SampleViewContainer extends Component {
  render() {
    return (
      <div className="row">

   
    {/* The main experimental control panel */}
    <div className="col-xs-12">
            <div className="col-md-12">
              <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">SampleImage</h8>
                </div>
                <div className="panel-body">
                  <SampleImage/>
                </div>
              </div>
            </div>
          </div>
  </div>
    )
  }
}


function mapStateToProps(state) {
  return {
    todos: "Map to state"
  }
}

function mapDispatchToProps(dispatch) {
 return {
    //actions: (sample) => dispatch(addSample(sample))
    actions: bindActionCreators(QueueActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer)