import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleQueue from '../components/General/SampleQueue';
import * as QueueActions from '../actions/queue'

class SampleQueueContainer extends Component {

  addSample(){
    this.props.actions.addSample("Add Characterisation");
    this.props.actions.requestlogin("Called a synq funqestion");
  }
    
  render() {
    
    let results = []
    for (var key in this.props.data.samples) {
        results.push({id:key,
        text: this.props.data.samples[key]
        });
    }

    return (
      <div className="row">
      <div className="col-xs-12">
        <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">SampleQueue</h8>
                </div>
                <div className="panel-body">
                <ul>
                {results.map(function(result) {
                      return <SampleQueue key={result.id} data={result}/>;
                  })}
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

    data: state.queue
    
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
)(SampleQueueContainer)