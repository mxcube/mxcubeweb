import React from 'react';
import SampleQueueContainer from '../containers/SampleQueueContainer'
import MethodContainer from '../containers/MethodContainer'
import MXNavbarContainer from '../containers/MXNavbarContainer'
import { ErrorNotificationPanel } from './Logging'
import PleaseWaitDialog from './PleaseWaitDialog'
import './Main.css'
import io from 'socket.io-client';
const socket = io.connect('http://' + document.domain + ':' + location.port+"/hwr");

export default class Main extends React.Component {
    render() {
        return (<div className="container-fluid"> 
                      <PleaseWaitDialog/>
                      <div className="row">
                          <ErrorNotificationPanel/>
                          <MXNavbarContainer/>
                      </div>
                      <div className="row">
                          <div className="col-xs-2">
                            <SampleQueueContainer socket={socket}/>
                          </div>
                          <div className="col-xs-10">
                               {this.props.children}
                          </div>
                      </div>
                      <MethodContainer />
                  </div>)
    }    
}

