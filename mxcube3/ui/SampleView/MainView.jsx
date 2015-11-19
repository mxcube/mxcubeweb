'use strict';
require('./Functions');
var React = require('react');
var ReactDOM = require('react-dom');
var SampleMain = require('./SampleMain');
// Global variables for this applicaiton
var MAINVIEW = {
        MainView: null
    },

    // Objects from external javascript libraries
    React;

MAINVIEW.MainView = React.createClass({

	getInitialState: function () {
      return {
          progressbarStyle : { width: "42%"  }
      }
    },

  componentWillMount: function(){

  },
  componentDidMount: function(){
      this.anotherMethod()
  },
  anotherMethod: function(){
      this.setState({ progressbarStyle : { width: "100%"  } })
  },
  render: function () {

      return (
  <div>

    {/* Go to another page */}
    <div className="col-md-12">
            <ul className="pager">
              <li className="previous">
                <a href="#">←  Back to sample list</a>
              </li>
              <li className="next">
                <a href="#">Next Sample  →</a>
              </li>
            </ul>
    </div>
    {/* The main experimental control panel */}
    <div className="col-md-10">
            <div className="col-md-12">
              <div className="panel panel-primary text-center">
                <div className="panel-heading">
                  <h8 className="panel-title text-center">Sample Experiment Control</h8>
                </div>
                <div className="panel-body">
                  <SampleMain/>
                </div>
              </div>
            </div>
          </div>
    {/* The side panel */}
    <div className="col-md-2">
            <div className="panel panel-primary">
              <div className="panel-heading">
                <h3 className="panel-title">Whatever goes here</h3>
              </div>
              <div className="panel-body">
                <p>Panel content</p>
              </div>
            </div>
          </div>

        <div className="section">
    <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="active progress progress-striped">
              <div className="progress-bar" id='progressBar' role="progressbar" style={this.state.progressbarStyle}>42% of Samples Collected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
     );        
  },
});


ReactDOM.render(<MAINVIEW.MainView/>, document.getElementById('SampleCentring'));





