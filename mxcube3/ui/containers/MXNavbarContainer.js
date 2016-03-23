import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import MXNavbar from '../components/MXNavbar/MXNavbar'
import { doSignOut } from '../actions/login'
import { sendClearQueue } from '../actions/queue'



class MXNavbarContainer extends React.Component {

  render() {
    return (
        <MXNavbar userInfo={this.props.userInfo} signOut={this.props.signOut} loggedIn={this.props.loggedIn} location={this.props.location} setAutomatic={this.props.setAutomatic} reset={this.props.reset}/>
    )
  }
}


function mapStateToProps(state) {
        return { 
            userInfo: state.login.data,
            loggedIn: state.login.loggedIn,
            mode : state.queue.automatic
        }
}

function mapDispatchToProps(dispatch) {
    return {
        signOut: () => dispatch(doSignOut()),
        reset : bindActionCreators(sendClearQueue, dispatch)
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MXNavbarContainer);
