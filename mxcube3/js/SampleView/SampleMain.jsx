/** @jsx React.DOM */
/* eslint-disable no-console */
'use strict';

// Global variables for this applicaiton
var SAMPLEMAIN = {
        SampleCentring: null
    },

    // Objects from external javascript libraries
    React;

SAMPLEMAIN.SampleMain = React.createClass({
	getInitialState: function () {
      return {
          sampleName: 'Sample_42'
      }
    },

  componentWillMount: function(){
  },

  changeProgress: function(){
      var pBar = document.getElementById("progressBar")
      // pBar.style
  },
  render: function () {
      return (
        <div className="col-md-12">
            <div className="panel panel-primary text-center">
                <div className="panel-heading">
                    <h3 className="panel-title">Sample Centring</h3>
                </div>
               <div className="panel-body">
                    <SAMPLEVIEW.SampleCentring/>
                </div>
            </div>
        </div>
            );
  },
});
//React.render(<SampleCentring/>, document.getElementById('SampleCentringHere'));
