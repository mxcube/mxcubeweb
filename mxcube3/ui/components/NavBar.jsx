import React from 'react'
import { connect } from 'react-redux'
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap"
import LoginForm from './Login'
import SampleQueueContainer from '../containers/SampleQueueContainer'
import { doSignOut } from '../actions/login'

export default class MXNavbar extends React.Component {
	constructor(props) {
		super(props);
		this.state = { active: null };
		console.log(this.props)
	}

	set_active(name) {
		this.setState({ active: name });
	}

	logOut() {
			this.props.signOut()
	}

	render() {
	        let proposal=this.props.userInfo.Proposal;
		let propInfo = proposal.title+ " - " +proposal.code;
		return (
			<div>
				<Navbar inverse fluid fixedTop>
					<NavBrand>MXCuBE 3</NavBrand>
					<Nav navbar>
						<NavItem eventKey={1} active={(this.state.active === 'samples') ? true : false} href="#/samplegrid">Samples</NavItem>
						<NavItem eventKey={2} active={(this.state.active === 'dc') ? true : false} href="#/datacollection">Data Collection</NavItem>
            <NavItem eventKey={3} active={(this.state.active === 'logging') ? true : false} href="#/logging">System log</NavItem>
					</Nav>
					<Nav right eventKey={0}>
						<p className="navbar-text" style={{float: 'none', display: 'inline-block'}}>{propInfo}</p>
          	<button className="btn btn-sm btn-info" style={{marginRight: '15px'}} onClick={this.logOut.bind(this)}>Log out</button>
          </Nav>
				</Navbar>
			</div>)
	}
}

function mapStateToProps(state) {
		return { userInfo: state.login.data }
}

function mapDispatchToProps(dispatch) {
    return {
        signOut: () => dispatch(doSignOut())
    }
}

export default connect(
    mapStateToProps,
		mapDispatchToProps
)(MXNavbar);
