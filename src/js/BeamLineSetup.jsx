/** @jsx React.DOM */

var beamline_params = { energy: { label: "Energy", default_value: 12.3984 },
                        resolution: { label: "Resolution", default_value: 1.150 },
                        trans: { label: "Transmission", default_value: 100.0 },
                        beam_size: { label: "Beam Size", default_value: 120 } } 

var BeamLine = React.createClass({
     
    getInitialState: function () {
        return {
            energy: { label: "Energy", default_value: 12.3984, value: 0 },
            resolution: { label: "Resolution", default_value: 2.498, value: 0 },
            beam_size: { label: "Size", default_value: 50.0, value: 0 },
            transmission: {label: "Transmission", default_value: 100.0, value: 0},
          };
    },
     componentWillMount: function() {
        //window.app_dispatcher.on("queue:new_item", this._add_queue_item);
     },
     componentWillUnMount: function() {
       //window.app_dispatcher.off("queue:new_item", this._add_queue_item);
     },

    push: function(id,data){
    console.log("push requested")
    console.log(id, data)
    $.ajax({
      url: '/mxcube/api/v0.1/beamline/'+id+'/move?newpos='+data,
      data: {'moveable': id, 'position':data},
      type: 'PUT',
      success: function(res) {
          console.log(res);
        },
      error: function(error) {
        console.log(error);
        },
    });
    },

    isNumberKey: function(ev){
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
            this.push(ev.target.id,document.getElementById(ev.target.id).value)
      }
         return true;
    },
 
     render: function() {
         return <div className="panel panel-default">
                  <div className="panel-heading clearfix">
                    <b className="panel-title pull-left">Beamline setup</b>
                  </div>
                  <div className="panel-body">
                      <div className="input-group">
                          <span className="input-group-addon" id="basic-addon1">Energy</span>
                          <input type="number" id="Energy" onKeyPress={this.isNumberKey}/>
                      </div>
                      <div className="input-group">
                          <span className="input-group-addon" id="basic-addon2">Resolution</span>
                          <input type="number" id="Resolution" onKeyPress={this.isNumberKey}/>
                      </div>
                      <div className="input-group">
                          <span className="input-group-addon" id="basic-addon4">Beam Size</span>
                          <input type="number" id="BeamSize" onKeyPress={this.isNumberKey}/>
                      </div>
                 	</div>
                </div>
    }
});

React.render(<BeamLine/>, document.getElementById('beamline'));
