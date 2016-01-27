import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleImage from '../components/SampleView/SampleImage';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import { showForm } from '../actions/methodForm'


class SampleViewContainer extends Component {
  render() {
    return (
      <div className="row">
    <div className="col-xs-12">
            <div className="col-md-12">
              <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">SampleImage</h8>
                </div>
                <div className="panel-body">
                  <SampleImage showForm={this.props.showForm}/>
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
          current : state.queue.current,
          sampleInformation: state.samples_grid.samples_list,
          lookup: state.queue.lookup,
    }
}

function mapDispatchToProps(dispatch) {
 return  {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    showForm : bindActionCreators(showForm, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer)