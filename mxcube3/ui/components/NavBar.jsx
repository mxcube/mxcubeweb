import React from 'react'
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap"
import Login from '../containers/LoginContainer'
import ErrorNotificationPanel from 'Logging'

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
				<ErrorNotificationPanel/>
				<Navbar inverse fluid>
					<NavBrand>MXCuBE 3</NavBrand>
					<Nav navbar>
						<NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#/samplegrid">Samples</NavItem>
						<NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#/datacollection">Data Collection</NavItem>
					</Nav>
					<Login/>
				</Navbar>
                                <div className="container-fluid">
                                    <div className="row">
                                        <div className="col-xs-2">
                                        </div>
                                        <div className="col-xs-10">
                                             {this.props.children}
                                        </div>
                                    </div>
                                </div>
			</div>)
	}
}
