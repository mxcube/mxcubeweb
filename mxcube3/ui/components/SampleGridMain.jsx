import React from 'react'
import ReactDOM from 'react-dom'
import SampleGrid from './SampleGrid'
import { Input, Button, Glyphicon  } from "react-bootstrap"
import { samples_list } from '../test-samples-list'

export default class SampleGridMain extends React.Component {
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
			<Button className="btn-primary">Check sample changer contents</Button>
		);

		return (<div>
				{searchInput}
				{checkScContents}
				<SampleGrid samples_list={samples_list}/>
				{this.props.children}
			</div>)
	}
}
