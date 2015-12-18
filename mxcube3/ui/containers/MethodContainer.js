import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Characterisation from '../components/Methods/Characterisation'
import DataCollection from '../components/Methods/DataCollection'
import { hideForm } from '../actions/methodForm'
import { sendAddSampleMethod, sendChangeSampleMethod } from '../actions/samples_grid'



class MethodContainer extends Component {

  render() {

    const selected = this.props.selected;
    console.log(selected);
    
    return (
      <div>
      	   	<Characterisation show={this.props.showCharac} changeMethod={this.props.changeMethod.bind(this, selected.parent_queue_id, selected.queue_id, selected.sample_id, selected.list_index)} addMethod={this.props.addMethod.bind(this, selected.queue_id, selected.sample_id)} closeModal={() => this.props.hideForm("characterisation")} selected={selected} sampleList={this.props.sampleList} />
            <DataCollection show={this.props.dataCollec} changeMethod={this.props.changeMethod.bind(this, selected.parent_queue_id, selected.queue_id, selected.sample_id, selected.list_index)} addMethod={this.props.addMethod.bind(this, selected.queue_id, selected.sample_id)} closeModal={() => this.props.hideForm("datacollection")} selected={selected} sampleList={this.props.sampleList} />
      </div>
    )
  }
}


function mapStateToProps(state) {

  return { 
        showCharac : state.methodForm.characterisation,
        dataCollec : state.methodForm.datacollection,
        selected : state.queue.selected,
        sampleList : state.samples_grid.samples_list
    }
}

function mapDispatchToProps(dispatch) {
 return {
      hideForm : bindActionCreators(hideForm, dispatch),
      addMethod : bindActionCreators(sendAddSampleMethod, dispatch),
      changeMethod : bindActionCreators(sendChangeSampleMethod, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MethodContainer)

