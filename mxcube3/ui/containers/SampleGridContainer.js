import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import SampleGrid from '../components/SampleGrid/SampleGrid'
import { Input, Button, Glyphicon  } from "react-bootstrap"
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll } from '../actions/samples_grid'

class SampleGridContainer extends React.Component {
	render() {
		const innerSearchIcon = (
			<Button><Glyphicon glyph="search"/></Button>
		);

		const searchInput = (
			<form className="form-horizontal">
				<Input type="text" label="Filter" labelClassName="col-xs-1" wrapperClassName="col-xs-3" buttonAfter={innerSearchIcon}/>
			</form>
		);

		const checkScContents = (
			<Button className="btn-primary" onClick={this.props.getSamples}>Check sample changer contents</Button>
		);

		return (<div className="col-lg-10">
                            <div className="row">
                                <div className="col-xs-4">
				{searchInput}
                                </div>
                               <div className="col-xs-2">
				{checkScContents}
                               </div>
                            </div>
                            <div className="row"> 
                                <div className="col-lg-10">
				    <SampleGrid samples_list={this.props.samples_list} toggleSelected={this.props.toggleSelected}/>
                                </div>
                            </div>
			</div>)
	}
}

function mapStateToProps(state) {
    return state.samples_grid
}

function mapDispatchToProps(dispatch) {
    return {
        getSamples: () => dispatch(doGetSamplesList()),
        updateSamples: (samples_list) => dispatch(doUpdateSamples(samples_list)),
        toggleSelected: (index) => dispatch(doToggleSelected(index)), 
        selectAll: () => dispatch(doSelectAll())
    }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer)

