import React from 'react';
import ReactDOM from 'react-dom';
import MethodContainer from '../containers/MethodContainer'
import MXNavbarContainer from '../containers/MXNavbarContainer'
import { ErrorNotificationPanel } from './Logging'
import PleaseWaitDialog from './PleaseWaitDialog'
import './Main.css'

export default class Main extends React.Component {
    render() {
        return ( <div align="center">
                      <PleaseWaitDialog/>
                      <div className="row">
                          <ErrorNotificationPanel/>
                          <MXNavbarContainer/>
                      </div>
                      <div className="row">
                          <div className="col-xs-2">
                           	<SampleQueueContainer />
                          </div>
                          <div className="col-xs-10 main-content">
                               {this.props.children}
                          </div>
                      </div>
                      <MethodContainer />
                  </div>
                 )
    }
}
