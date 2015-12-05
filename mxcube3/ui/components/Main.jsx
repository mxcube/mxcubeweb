import React from 'react';
import ReactDOM from 'react-dom';
import SampleQueueContainer from '../containers/SampleQueueContainer'
import NavBar from './NavBar'

export default class Main extends React.Component {
    render() {
        return (<div className="container-fluid">
                      <div className="row">
                          <NavBar/>
                      </div>
                      <div className="row">
                          <div className="col-xs-2">
                           	<SampleQueueContainer />
                          </div>
                          <div className="col-xs-10">
                               {this.props.children}
                          </div>
                      </div>
                  </div>)
    }    
}

