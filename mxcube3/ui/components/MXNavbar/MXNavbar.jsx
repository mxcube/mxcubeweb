import React from 'react'
import { Navbar, NavBrand, Nav, NavItem } from "react-bootstrap"


export default class MXNavbar extends React.Component {
	constructor(props) {
		super(props);
		this.state = { active: null };
	}

	componentWillMount(){
		if(this.props.loggedIn === false){
      		window.location.assign("#/login");    
    	}
	}
	componentWillReceiveProps(nextProps){
		console.log(this.props);
    	if(nextProps.loggedIn === false){
      		window.location.assign("#/login");    
    	}
  	}

	set_active(name) {
		this.setState({ active: name });
	}

	render() {
		let proposal= this.props.userInfo.Proposal;
		let propInfo = (this.props.loggedIn ? proposal.title+ " - " +proposal.code : "");

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
          				<button className="btn btn-sm btn-info" style={{marginRight: '15px'}} onClick={() => this.props.signOut()}>Log out</button>
         		 </Nav>
				</Navbar>
			</div>)
	}
}
