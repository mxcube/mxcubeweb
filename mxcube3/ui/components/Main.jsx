import React from 'react';
import ReactDOM from 'react-dom';
import SampleQueueContainer from '../containers/SampleQueueContainer'
import NavBar from './NavBar'
import ErrorNotificationPanel from './Logging'
import PleaseWaitDialog from './PleaseWaitDialog'

export default class Main extends React.Component {
    render() {
        return (<div className="container-fluid"> 
                      <PleaseWaitDialog/>
                      <div className="row">
                          <ErrorNotificationPanel/>
                          <NavBar/>
                      </div>
                      <div className="row">
                          <div className="col-xs-2">
                           	<SampleQueueContainer />
                          </div>
                          <div className="col-lg-10">
                               {this.props.children}
                          </div>
                      </div>
                  </div>)
    }    
}

