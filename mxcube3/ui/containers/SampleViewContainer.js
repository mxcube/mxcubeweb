import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import SampleImage from '../components/SampleView/SampleImage';
import * as QueueActions from '../actions/queue'
import * as SampleActions from '../actions/samples_grid'
import * as SampleViewActions from '../actions/sampleview'
import { showForm } from '../actions/methodForm'


class SampleViewContainer extends Component {

  renderPoint(value){
    return(
       <tr>
     <td colSpan="3">
          <div>Point {value.posId}</div>                             
     </td>
     </tr>
     );
  }

  render() {
    return (
      <div className="row">
      <div className="col-xs-3">
        <div className="information-box"><h2 className="text-center">Saved Points</h2>
        <hr className="divider" />
        <table id="newtable" className="table table-bordered table-striped fixedtable">
    <tbody>

    </tbody>    
</table>  
        </div>
      </div>
        <div className="col-xs-6">
                  <SampleImage showForm={this.props.showForm} sampleActions={this.props.sampleViewActions} sampleViewState={this.props.sampleViewState} />
        </div>
  </div>
    )
  }
}


function mapStateToProps(state) {
  return { 
          current : state.queue.current,
          sampleInformation: state.samples_grid.samples_list,
          sampleViewState: state.sampleview,
          lookup: state.queue.lookup
    }
}

function mapDispatchToProps(dispatch) {
 return  {
    queueActions: bindActionCreators(QueueActions, dispatch),
    sampleActions : bindActionCreators(SampleActions, dispatch),
    sampleViewActions : bindActionCreators(SampleViewActions, dispatch),
    showForm : bindActionCreators(showForm, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleViewContainer)