import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Characterisation from '../components/Methods/Characterisation'
import { hideForm } from '../actions/methodForm'
import { sendAddSampleMethod } from '../actions/samples_grid'



class MethodContainer extends Component {

  render() {

    const selected = this.props.selected;

    return (
      <div>
      	   	<Characterisation show={this.props.showCharac} addMethod={this.props.addMethod.bind(this, selected.queue_id, selected.sample_id)} closeModal={() => this.props.hideForm("characterisation")} selected={selected} sampleList={this.props.sampleList} />
      </div>
    )
  }
}


function mapStateToProps(state) {

  return { 
        showCharac : state.methodForm.characterisation,
        selected : state.queue.selected,
        sampleList : state.samples_grid.samples_list
    }
}

function mapDispatchToProps(dispatch) {
 return {
      hideForm : bindActionCreators(hideForm, dispatch),
      addMethod : bindActionCreators(sendAddSampleMethod, dispatch)
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MethodContainer)

