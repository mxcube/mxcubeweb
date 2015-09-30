/** @jsx React.DOM */

var discrete_params =  {osc_range: { label: "Oscillation range", default_value: 1.0 },
                        osc_start: { label: "Oscillation start", default_value: 0 },
                        exp_time: { label: "Exposure time", default_value: 10.0 },
                        num_images: { label: "Number of images", default_value: 1 }} 

var StandardCollection = React.createClass({
    getInitialState: function () {
        return {
            osc_range: { label: "Oscillation range", default_value: 1.0, value: 1.0 },
            osc_start: { label: "Oscillation start", default_value: 0, value: 0 },
            exp_time: { label: "Exposure time", default_value: 10.0, value: 10.0 },
            num_images: { label: "Number of images", default_value: 1, value: 1 },
            energy: {label: "Energy", default_value: 12.3984, value: 12.3984 },
            resolution: {label: "Resolution", default_value: 2.498, value: 2.498 },
            transmission: {label: "Transmission", default_value: 100.0, value: 100.0},
          };
    },
    componentWillMount: function() {
        //window.app_dispatcher.on("queue:new_item", this._add_queue_item);
     },
    componentWillUnMount: function() {
       //window.app_dispatcher.off("queue:new_item", this._add_queue_item);
     },
    addCollection:function(){
      console.log("************* adding collection")
      console.log(this.state)
      auxState = this.state
      //cleaning unused backend data from the state
      for(i in auxState){
          delete auxState[i]['label']
          delete auxState[i]['default_value']
      }

      window.app_dispatcher.trigger("SampleTree:new_collection", { sample: "Sample01", node:'dummyName', type:'Collection', params: auxState});//, text: "Discrete", fields: discrete_params });

      $.ajax({
      url: '/mxcube/api/v0.1/samples/samp01/collections/col01',
      data: {'parameters': auxState, 'Method': 'StandardCollection', 'SampleId':'samp01', 'CollectionId': 'col01'},
      type: 'POST',
      success: function(res) {
          console.log(res);
        },
      error: function(error) {
          console.log(error);
        },
    });
    },


    // runCollection:function(){
    //   console.log("************* adding collection")
    //   console.log(this.state)
    //   $.ajax({
    //   url: '/mxcube/api/v0.1/samples/sampid/collections/colid/run"',
    //   data: {'parameters': this.state, 'Method': 'StandardCollection', 'SampleId':'samp01', 'CollectionId': 'col01'},
    //   type: 'POST',
    //   success: function(res) {
    //       console.log(res);
    //     },
    //   error: function(error) {
    //       console.log(error);
    //     },
    // });
    // },
    isNumberKey: function(ev){
        //in order to save the current params into the state 'enter' must be pressed
        console.log("checking numbers") 
        var charCode = (ev.which) ? ev.which : event.keyCode
        if (charCode > 31 && (charCode < 48 || charCode > 57)){
            console.log("is a number")  
            return false;}
        if (ev.key == "Enter"){
            console.log("enter pressed")
            var auxSt = this.state
            var aux = auxSt[ev.target.id]
            aux['value'] = ev.target.value
            this.setState(aux)
        }
        return true;
        },
 
    render: function() {
        return <div className="panel panel-default">
                  <div className="panel-heading clearfix">
                    <b className="panel-title pull-left">Standard Collection</b>
                  </div>
                    	<div className="panel-body">
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon1">Oscillation range</span>
                          <input type="number" id="osc_range" onKeyPress={this.isNumberKey} value={this.state['osc_range']['value']}/>
                        </div>
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon2">Oscillation start</span>
                          <input type="number" id="osc_start" onKeyPress={this.isNumberKey} value={this.state['osc_start']['value']}/>
                          <input type="checkbox" name="activate" value="active" />
                        </div>
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon3">Exposure time</span>
                          <input type="number" id="exp_time" onKeyPress={this.isNumberKey} value={this.state['exp_time']['value']}/>
                        </div>
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon4">Energy</span>
                          <input type="number" id="energy" onKeyPress={this.isNumberKey} value={this.state['energy']['default_value']}/>
                        </div>
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon5">Resolution</span>
                          <input type="number" id="resolution" onKeyPress={this.isNumberKey} value={this.state['resolution']['value']}/>
                        </div>
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon6">Transmission</span>
                          <input type="number" id="transmission" onKeyPress={this.isNumberKey} value={this.state['transmission']['value']}/>
                        </div>
                        <div className="input-group">
                          <span className="input-group-addon" id="basic-addon7">Number of images</span>
                          <input type="number" id="num_images" onKeyPress={this.isNumberKey} value={this.state['num_images']['value']}/>
                        </div>
                        <button onClick={this.addCollection}>Add to queue</button>
                 	</div>
                </div>
    }
});

React.render(<StandardCollection/>, document.getElementById('standardcollection'));
