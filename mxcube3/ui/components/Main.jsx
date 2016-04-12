import React from 'react';
import SampleQueueContainer from '../containers/SampleQueueContainer'
import MXNavbarContainer from '../containers/MXNavbarContainer'
import TaskContainer from '../containers/TaskContainer'
import PleaseWaitDialog from '../containers/PleaseWaitDialog'
import ErrorNotificationPanel from '../containers/ErrorNotificationPanel'
import './Main.css'



export default class Main extends React.Component {
    render() {
        return (<div> 
                      <TaskContainer/>
                      <PleaseWaitDialog/>
                      <ErrorNotificationPanel/>
                      <MXNavbarContainer location={this.props.location}/>
                      <div className="container-fluid">
                        <div className="row">
                          <div className="col-xs-2">
                            <SampleQueueContainer/>
                          </div>
                          <div className="col-xs-10 main-content">
                               {this.props.children}
                          </div>
                        </div>
                      </div>
                  </div>)
    }    
}
