/** @jsx React.DOM */
var SampleMain = React.createClass({
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
                    <SampleCentring/>
                </div>
            </div>
        </div>
            );
  },
});
//React.render(<SampleCentring/>, document.getElementById('SampleCentringHere'));
