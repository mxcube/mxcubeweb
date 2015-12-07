import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import SampleGrid from '../components/SampleGrid/SampleGrid'
import { Input, Button, Glyphicon  } from "react-bootstrap"
import { doGetSamplesList, doUpdateSamples, doToggleSelected } from '../actions/samples_grid'

class SampleGridContainer extends React.Component {
	render() {
		const innerSearchIcon = (
			<Button><Glyphicon glyph="search"/></Button>
		);

		const searchInput = (
			<form className="form-horizontal">
				<Input type="text" label="Filter" labelClassName="col-xs-3" wrapperClassName="col-xs-9" buttonAfter={innerSearchIcon}/>
			</form>
		);

		const checkScContents = (
			<Button className="btn-primary" onClick={this.props.getSamples}>Check sample changer contents</Button>
		);

		const addSampleToQueue = (
			<Button className="btn-primary" onClick={this.props.getSamples}>Add to Queue</Button>
		);

		return (<div className="row">
					<div className="col-xs-2">
						{searchInput}
					</div>
					<div className="col-xs-8">
						<div className="text-center">{checkScContents}</div>
					</div>
				<SampleGrid samples_list={this.props.samples_list} toggleSelected={this.props.toggleSelected}/>
				<div className="col-xs-12">
						{addSampleToQueue}
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
        toggleSelected: (index) => dispatch(doToggleSelected(index))
    }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer)

