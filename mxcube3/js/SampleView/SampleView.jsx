/** @jsx React.DOM */
/* global $*/
/* eslint-disable no-console */
'use strict';

// Global variables for this applicaiton
var SAMPLEVIEW = {
        SampleCentring: null,
        EditableField: null
    },

    // Objects from external javascript libraries
    React;

SAMPLEVIEW.SampleCentring = React.createClass({
	getInitialState: function () {
    var source = new EventSource('/mxcube/api/v0.1/samplecentring/camera/subscribe');
    source.addEventListener('update',this.eventHandlerUpdate);
    return {
      sampleName: 'Sample_42',
      currentZoom: 0,
      zoomLevels:["Zoom 1","Zoom 2","Zoom 3","Zoom 4","Zoom 5","Zoom 6","Zoom 7","Zoom 8","Zoom 9", "Zoom 10"],
      zoomText: "Zoom 1",
      light:0,
      pos:[],
      clickMethod: 0 //if we are in the centring procedure, the click method has another meaning, 0: nothing, 1: centring, 2: measurement
    }
  },
  componentWillMount: function(){
  },
  aMethod: function(){
      console.log('aMethod Called')  
  },
  drawSampleImage: function(im_src){
    //Draws the image from the diff HO. In addition, if there are points
    // already marked in the canvas re-display them,
    hau = this;
    var scale = this.state.zoomText,
        points = this.state.pos,
        new_image = new Image,
        canvas = null,
        context = null,
        canvas_size = [659, 493];

        function drawCircle(point, radius) {
            context.beginPath();
            context.arc(point[0], point[1], radius, 0, Math.PI * 2);
            context.stroke();
        }
        function drawPoints() {
            // Redraw all the existing points, if there are any
            console.log('drawPoints started');
            points.map(function(point) {
                console.log('iterating over points');
                drawCircle(point, 5);
                drawCircle(point, 1);
            });
            console.log('Done drawing points');
        }
        function drawLine(x0, y0, x1, y1) {
            // Draw a line betweeen two points
            context.strokeStyle = 'red';
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.stroke();
        }
        function drawDistanceLine() {
            // Draw a line between the last two points clicked
            if(hau.state.clickMethod=2){
              var numPoints = points.length;
              if (numPoints > 1) {
                  drawLine(
                      points[numPoints - 2][0], points[numPoints - 2][1],
                      points[numPoints - 1][0], points[numPoints - 1][1]);
              }
            }
        } 
        function drawText(argText, x0, y0) {
            // Draw text somewhere on the image
            context.strokeStyle = 'red';
            context.font = '11px Verdana';
            context.beginPath();
            context.strokeText(argText, x0, y0);
            context.stroke();
        }
        function drawDistanceText() {
            // Display the distance measured between the last two points
            // clicked
            var numPoints = points.length, x0, y0, x1, y1, xDiff, yDiff,
                distance;
            if (numPoints > 1) {
                x0 = points[numPoints - 1][0];
                x1 = points[numPoints - 2][0];
                y0 = points[numPoints - 1][1];
                y1 = points[numPoints - 2][1];

                xDiff = x1 - x0;
                yDiff = y1 - y0;

                distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
                distance = Math.round(distance * 100) / 100;
                // to um
                distance = Math.round(distance/0.346)
                drawText('Distance: ' + distance + ' \u03BC'+'m',
                    canvas_size[0] - 150, canvas_size[1] - 23);
            }
        }
        function drawScale() {
            // Draw an axes scale, along with the zoom level, in the lower left
            drawText(scale, 15, canvas_size[1] - 23);
            drawLine(10, canvas_size[1] - 43, 10, canvas_size[1] - 13);
            drawLine(10, canvas_size[1] - 13, 40, canvas_size[1] - 13);
        }
        function drawImage() {
            // Clear the canvas, then display the image
            canvas = document.getElementById('canvas');
            context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas_size[0], canvas_size[1]);
            context.drawImage(new_image, 0, 0);
        }
        function drawBeam(){
            context.strokeStyle = "blue";
            context.beginPath();
            context.arc(329, 247, 20, 0, Math.PI * 2);
            context.stroke();
            context.strokeStyle = "red"; //red 
        }
        new_image.onload = function() {
            // Wait until the image is loaded to draw everything
            // -- perhaps one should also wiat until the function called by the
            //    onClick event has finished as well
            // Get the image from somewhere and display it
            drawImage();
            // Draw a scale on top of the image
            drawScale();
            // Redraw any points that might have been clicked
            drawPoints();
            // If measuring distnaces, display a line between two points and
            // the distnace measured
            drawDistanceLine();
            drawDistanceText();
        };

        // The source for the image - needs to be defined after 'onload'
        // This needs to be changed in the future to present video images
        new_image.src = "data:image/jpeg;base64,"+im_src;

        console.log('drawSampleImage ended');

    var context = document.getElementById("canvas").getContext('2d');
    context.clearRect(0, 0, 659, 493);
  },
  drawPoint: function(x,y){
    //called by clicking in the canvas, displays a circle with a dot in the center
    var context = document.getElementById("canvas").getContext('2d');
    //draw circle
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.stroke();
    //draw center point
    context.beginPath();
    context.arc(x, y, 1, 0, Math.PI * 2);
    context.stroke();
  },
  deletePoints: function(){
    console.log("deleting")
    this.setState({clickMethod: 0}) 
    this.setState({pos: []});
    },
  getPosition: function (element) {
    //adjust point position according to the position of the canvas in the web-page
      var xPosition = 0;
      var yPosition = 0;
      
      while (element) {
          xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
          yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
          element = element.offsetParent;
        }
      return { x: xPosition, y: yPosition };
  },
  eventHandlerUpdate: function(ev){
      //retrieves the image string from the server and call to draw
      console.log('eventHandling..')
      im_src= ev.data;
      this.drawSampleImage(im_src)
  },
  onClick: function(e){
    var parentPosition = this.getPosition(e.currentTarget),
      x = e.clientX - parentPosition.x,
      y = e.clientY - parentPosition.y,
      aux = this.state.pos,
      numPoints, xDiff, yDiff, distance;
    
    aux.push([x,y])
    this.setState({pos: aux})
    this.drawPoint(x,y);
    
    if (this.state.clickMethod==0){
      console.log('clicked')
      $.ajax({
          url: '/onClick',
          data: {'PosX': x, 'PosY': y},
        type: 'PUT',
          success: function(res) {
              console.log(res);
          },
          error: function(error) {
              console.log(error);
          },
      });
    }
    else if(this.state.clickMethod==2){
      console.log('clicked: measureDistance')
      numPoints = aux.length;
      if (numPoints > 1) {
        xDiff = aux[numPoints - 2][0] - aux[numPoints - 1][0];
        yDiff = aux[numPoints - 2][1] - aux[numPoints - 1][1];
        distance = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
        distance = Math.round(distance * 100) / 100;
      }
    }
    else{  
      console.log('clicked: centring')
      $.ajax({
          url: '/mxcube/api/v0.1/samplecentring/centring/click?clickPos={"x":'+x+',"y":'+ y+'}',
          data: {'PosX': x, 'PosY': y},
        type: 'PUT',
          success: function(res) {
              console.log(res);
          },
          error: function(error) {
              console.log(error);
          },
      });
  }
  },
  addCentringPoint: function(){
  },
  startCentring: function(){
    this.setState({clickMethod: 1})
    //alert("Automatic centring going to start... ok?")
    $.ajax({
        url: '/mxcube/api/v0.1/samplecentring/centring/startauto',
        type: 'PUT',
        success: function(res) {
            console.log(res);
        },
        error: function(error) {
          console.log(error);
        },
    });
  },
  start3ClickCentring: function(){
    this.setState({clickMethod: 1})
    //alert("3 click centring going to start, user input is required... ok?")
    $.ajax({
        url: '/mxcube/api/v0.1/samplecentring/centring/start3click',
        type: 'PUT',
        success: function(res) {
            console.log(res);
        },
        error: function(error) {
          console.log(error);
        },
    });

  },
  measureDistance: function(){
    this.setState({clickMethod: 2})

  },
  getBeamPosition: function(){
  },
  componentDidMount: function(){
  },
  lightOnOff: function(ev){
    console.log("ligth on/off requested")
    var newLight = Number(!this.state.ligth)
    this.setState({ligth:newLight});
    console.log(newLight)
    console.log(this.state)
    $.ajax({
          url: '/mxcube/api/v0.1/samplecentring/backlight/move?newpos='+newLight,
          data: {'moveable': 'backlight', 'position':newLight},//not really needed, everything in the url (motor and newpos) 
        type: 'PUT',
          success: function(res) {
              console.log(res);
          },
          error: function(error) {
            console.log(error);
          },
      });
  },
  zoomIn: function(ev){
    var newIndex = Math.max(0, Math.min(this.state.currentZoom+=1, 9))
    var newZoom = this.state.zoomLevels[newIndex]
    this.setState({currentZoom: newIndex})
    this.setState({zoomText: newZoom})
    $.ajax({
          url: '/mxcube/api/v0.1/samplecentring/zoom/move?newpos='+newZoom,
          data: JSON.stringify({'moveable': 'Zoom', 'position': newZoom}, null, '\t'),
          contentType: 'application/json;charset=UTF-8',
          type: 'PUT',
          success: function(res) {
              console.log(res);
          },
          error: function(error) {
            console.log(error);
          },
      });
  },
  zoomOut: function(ev){    
    var newIndex = Math.max(0, Math.min(this.state.currentZoom-=1, 9))
    var newZoom = this.state.zoomLevels[newIndex]
    this.setState({currentZoom: newIndex})
    this.setState({zoomText: newZoom})
    $.ajax({
      url: '/mxcube/api/v0.1/samplecentring/zoom/move?newpos='+newZoom,
      data: JSON.stringify({'moveable': 'Zoom', 'position': newZoom}, null, '\t'),//not really needed, everything in the url (motor and newpos) 
      contentType: 'application/json;charset=UTF-8',
      type: 'PUT',
      success: function(res) {
          console.log(res);
      },
      error: function(error) {
        console.log(error);
      },
    });
    },
  takeSnapshot: function(){
    // var dataURL = document.getElementById('canvas').toDataURL("image/png");
    // dataURL = dataURL.replace("image/png", "image/octet-stream");
    // document.location.href = dataURL;
    console.log('Taking snapshot...')
    $.ajax({
      url: '/mxcube/api/v0.1/samplecentring/snapshot',
      contentType: 'application/json;charset=UTF-8',
      type: 'PUT',
      success: function(res) {
          console.log(res);
      },
      error: function(error) {
        console.log(error);
      },
    });
    },
  //only will send data when 'enter' key is pressed, the spinbox up/down fire the onInput event, as well as anything type in the box, so for setting 314.5 -> four event are sent. TODO: add event handling for the spin box, so a different filter is needed.
  push: function(id,data){
    console.log("push requested")
    $.ajax({
      url: '/mxcube/api/v0.1/samplecentring/'+id+'/move?newpos='+data,
      data: {'moveable': id, 'position':data},//not really needed, everything in the url (motor and newpos) 
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
      var charCode = (ev.which) ? ev.which : event.keyCode
      //be carefull, ascii 46 = '.', but 47='/' and 48='0', a better filtering required
      if (charCode > 31 && (charCode < 46 || charCode > 57)){
            return false;}
      if (ev.key == "Enter"){
            this.push(ev.target.id,document.getElementById(ev.target.id).value)
      }
         return true;
      },
  componentDidUpdate: function(){
      this.drawSampleImage();
      console.log('comp did update')
    },

  render: function () {
    this.getInitialState();
    var videoStyle = {position:'absolute', top:0, left:0, zIndex:-1 };
    var canvasStyle = {position:'relative', zIndex:1};
    var logStyle ={maxHeight:70, overflowY:"scroll"}// {'overflow-y':"scroll", 'overflow-x':"hidden", height:400px};
//    <video id="video" style={videoStyle} poster="/mxcube/api/v0.1/samplecentring/camera/stream" />
//    <img src="/Users/mikegu/Desktop/md2.jpg"  style={videoStyle} id='SampleImage' className="center-block img-responsive"> </img>
//<video id="video" width={659} height={493} style={videoStyle}  poster="/mxcube/api/v0.1/samplecentring/camera/stream"/>
    return (
                <div>
                    <canvas id="canvas"  height={493} width={659} onClick={this.onClick} />
                    <hr></hr>
                    <div className="panel panel-info">
                        <div className="panel-heading">
                            <h3 className="panel-title">Controls</h3>
                        </div>
                        <div className="panel-body">
                            <button type="button" className="btn btn-link  pull-center" onClick={this.takeSnapshot}><i className="fa fa-2x fa-fw fa-save"></i></button>                            
                            <button type="button" className="btn btn-link  pull-center" onClick={this.measureDistance}><i className="fa fa-2x fa-fw fa-calculator"></i></button>                              
                            <button type="button" className="btn btn-link  pull-center" onClick={this.aMethod}><i className="fa fa-2x fa-fw fa-arrows-v"></i></button>                            
                            <button type="button" className="btn btn-link  pull-center" onClick={this.takeSnapshot}><i className="fa fa-2x fa-fw fa-camera"></i></button>                            
                            <button type="button" className="btn btn-link  pull-center" onClick={this.startCentring}><i className="fa fa-2x fa-fw fa-arrows"></i></button>
                            <button type="button" className="btn btn-link  pull-center" onClick={this.start3ClickCentring}><i className="fa fa-2x fa-fw fa-circle-o-notch"></i></button>
                            <button type="button" className="btn btn-link  pull-center" onClick={this.deletePoints}><i className="fa fa-2x fa-fw fa-times"></i></button>
                            <button type="button" className="btn btn-link  pull-center" onClick={this.zoomIn}><i className="fa fa-2x fa-fw fa fa-search-plus"></i></button>
                            <button type="button" className="btn btn-link  pull-center" onClick={this.zoomOut}><i className="fa fa-2x fa-fw fa fa-search-minus"></i></button>
                            <button type="button" className="btn btn-link  pull-center" onClick={this.lightOnOff}><i className="fa fa-2x fa-fw fa fa-lightbulb-o"></i> </button>
                            <div class="input-group">
                              <span class="input-group-addon" id="basic-addon1">Kappa   </span>
                              <input type="number"  id="Kappa" step="0.01" min='0' max='360'  class="form-control" placeholder="kappa" aria-describedby="basic-addon1" onKeyPress={this.isNumberKey} onkeyup={this.isNumberKey}> </input>
                              <span class="input-group-addon" id="basic-addon2">Omega   </span>
                              <input type="number"   id="Omega" step="0.01" min='0' max='360'  class="form-control" placeholder="omega" aria-describedby="basic-addon2" intermediateChanges='true' onKeyPress={this.isNumberKey}> </input>
                              <span class="input-group-addon" id="basic-addon3">Phi   </span>
                              <input type="number"  id="Phi" step="0.01" min='0' max='360'   class="form-control" placeholder="Phi" aria-describedby="basic-addon3" onKeyPress={this.isNumberKey}> </input>
                            </div>
                        </div>
                    </div>
                    {/* The Queue */}
                    <SAMPLETREE.SingleSampleTree/>
                    {/* The Experiment Configuration */}
                    <EXPERIMENTCONFIG.ExperimentConfiguration/>
                    <div className="well well-sm pre-scrollable" style={logStyle}> <samp id="log" className=""></samp> </div>
                </div>
            );        
  },
});
SAMPLEVIEW.EditableField = React.createClass({
  
   componentDidMount: function() {
      $(this.refs.editable.getDOMNode()).editable();
   }, 

   render: function() {
      return (
          <p>{this.props.name}: 
              <a href="#" ref="editable" 
                  data-name={this.props.name} 
                  data-pk={this.props.id} 
                  data-url="/beam_line_update" 
                  data-type="text" 
                  data-title="Edit value">
                  {this.props.value}
              </a>
          </p>
      );
   } 
})

