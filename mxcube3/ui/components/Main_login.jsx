import React from 'react';
import ReactDOM from 'react-dom';
import SampleQueueContainer from '../containers/SampleQueueContainer'
import MethodContainer from '../containers/MethodContainer'
import NavBar from './NavBar'
import { ErrorNotificationPanel } from './Logging'
import './Main.css'

export default class Main_login extends React.Component {
    render() {
        return (<div className="container-fluid"> 
                      <div className="row">
                          <NavBar/>
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
                  </div>)
    }    
}

