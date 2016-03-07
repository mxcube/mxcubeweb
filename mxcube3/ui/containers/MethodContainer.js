import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Characterisation from '../components/Methods/Characterisation'
import { hideForm } from '../actions/methodForm'
import { sendAddSampleMethod, sendChangeSampleMethod } from '../actions/samples_grid'



class MethodContainer extends React.Component {

  render() {

    const lookup = this.props.lookup;

    
    return (
      <div>
            <Characterisation 
                show={this.props.showCharac} 
                sampleIds={this.props.sample_ids}
                pointId={this.props.point_id}
                methodData={this.props.methodData}
                changeMethod={this.props.changeMethod} 
                addMethod={this.props.addMethod} 
                closeModal={this.props.hideForm} 
                lookup={lookup} 
                sampleList={this.props.sampleList} 
            />
      </div>
    )
  }
}


function mapStateToProps(state) {

  return { 
        showCharac : state.methodForm.characterisation,
        dataCollec : state.methodForm.datacollection,
        sample_ids : state.methodForm.sample_ids,
        point_id :  state.methodForm.point_id,
        methodData : state.methodForm.methodData,
        lookup: state.queue.lookup,
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

