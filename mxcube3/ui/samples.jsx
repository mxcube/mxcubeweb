import React from 'react';
import ReactDOM from 'react-dom';
import SampleGrid from 'SampleGrid';
import { Input, Button, Glyphicon  } from "react-bootstrap";



export default class SampleGridMain extends React.Component {

	constructor(props) {
		super(props);
	}

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



		return (
			<div>
			{searchInput}
			{checkScContents}
			<SampleGrid />
			{this.props.children}
			</div>
			)
	}
}

