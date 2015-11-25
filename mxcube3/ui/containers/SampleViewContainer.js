import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleImage from '../components/SampleView/SampleImage';
import DataCollection from '../components/SampleView/DataCollection';

class SampleViewContainer extends Component {
  render() {
    return (
      <div className="row">

   
    {/* The main experimental control panel */}
    <div className="col-xs-8">
            <div className="col-md-12">
              <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">Sample Experiment Control</h8>
                </div>
                <div className="panel-body">
                  <SampleImage/>
                </div>
              </div>
            </div>
          </div>
    {/* The side panel */}
    <div className="col-xs-4">
            <div className="panel panel-primary">
              <div className="panel-heading">
                <h3 className="panel-title">Current Setup / Experimental Setup</h3>
              </div>
              <div className="panel-body">
                <DataCollection />
              </div>
            </div>
          </div>


  </div>
    )
  }
}


function mapStateToProps(state) {
  return {
    progressbarStyle : { width: "42%"  }
  }
}

function mapDispatchToProps(dispatch) {
  return {
    // actions: bindActionCreators(TodoActions, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer)