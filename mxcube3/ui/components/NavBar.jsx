import React from 'react'
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap"
import Login from '../containers/LoginContainer'
import SampleQueueContainer from '../containers/SampleQueueContainer'


export default class MXNavbar extends React.Component {
	constructor(props) {
		super(props);
		this.state = { active: null };
	}

	set_active(name) {
		this.setState({ active: name });
	}

	render() {
		return (
			<div>
				<Navbar inverse fluid fixedTop>
					<NavBrand>MXCuBE 3</NavBrand>
					<Nav navbar>
						<NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#/samplegrid">Samples</NavItem>
						<NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#/datacollection">Data Collection</NavItem>
					</Nav>
					<Login/>
				</Navbar>
			</div>)
	}
}
