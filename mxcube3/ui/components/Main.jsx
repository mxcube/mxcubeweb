import React from 'react';
import ReactDOM from 'react-dom';
import MethodContainer from '../containers/MethodContainer'
import Login from '../containers/LoginContainer'
import { ErrorNotificationPanel } from './Logging'
import PleaseWaitDialog from './PleaseWaitDialog'
import './Main.css'

export default class Main extends React.Component {
    render() {
        return ( <div align="center">
                      <PleaseWaitDialog/>
                      <div className="row">
                          <ErrorNotificationPanel/>
-                      </div>
                      <Login/>
                      <MethodContainer />
                  </div>
                 )
    }
}
