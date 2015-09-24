/** @jsx React.DOM */

var Sample = React.createClass({

	drawSampleImage: function(im_src){
    //Draws the image from the diff HO. In addition, if there are points
    // already marked in the canvas re-display them, 
    var context = document.getElementById("canvas").getContext('2d');
    var scale = this.state.zoomText;
		var image = new Image();
		image.src = "data:image/jpeg;base64,"+im_src;// +"\n--!>
    console.log("drawing canvas")
		var points = this.state.pos;
	  image.onload = function(){
      console.log('drawing')
  		context.drawImage(image,0,0,493,659);
        //the next line for drawing a "|_" with the zoom text on the bottom left corner
  		context.beginPath();
      context.moveTo(10, 350);
  		context.lineTo(10, 380);
  		context.lineTo(40, 380);
  		context.strokeStyle = "red"; //red  
  		context.font="10px Verdana";
  		//the following text should be linked to the zoom level
  		context.strokeText(scale,15,370);
  		context.stroke();
      //if there are already some spots on the image redraw them
  		points.map(function(point){
  				context.beginPath();
  				context.arc(point[0], point[1], 5, 0, Math.PI * 2);
  				context.stroke();
          context.beginPath();
          context.arc(point[0], point[1], 1, 0, Math.PI * 2);
          context.stroke();

			});
	  };
	},

	drawPoint: function(x,y){
    //called by clicking in the canvas, displays a circle with a dot in the center
    var context = document.getElementById("canvas").getContext('2d');
		console.log('draw point')
    //draw circle
		context.beginPath();
		context.arc(x, y, 5, 0, Math.PI * 2);
		context.stroke();
    //draw center point
    context.beginPath();
    context.arc(x, y, 1, 0, Math.PI * 2);
    context.stroke();
	},

  getInitialState: function () {
     // this.streamSubscribe()
      //TODO: the ajax call in streamsubscribe is asynch, so no url return in time for setting the eventsource, hardcoded here and moving on.
      var source = new EventSource('/mxcube/api/v0.1/samplecentring/camera/subscribe');
      source.addEventListener('update',this.eventHandlerUpdate);
      // //this.streamSubscribe()
    	return {img: 'build/fakeimg.jpg',
  				width: 500,
				height: 400,
				zoomText: '50 um',
				pos: [],
        url: ''
  				}
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

  onClick: function(e){
    	var parentPosition = this.getPosition(e.currentTarget);
    	var x = e.clientX - parentPosition.x;
    	var y = e.clientY - parentPosition.y;
    	var aux = this.state.pos
    	aux.push([x,y])
    	this.setState({pos: aux})
    	this.drawPoint(x,y);
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
    },

  streamSubscribe: function(){
    console.log("stream subcribe requested")
    $.ajax({
      url: "/mxcube/api/v0.1/samplecentring/camera/subscribe",
      data: 'give me videooo',
      type: 'GET',
      success: function(res) {
          //console.log(res['url']);
          //var source = new EventSource(res['url']);
          //console.log(source)
          //source.addEventListener('update',this.eventHandlerUpdate);
          //console.log('Subscribing done')
          this.setState({url:res['url']})
        },
      error: function(error) {
        console.log(error);
        },
    });
  },
    // eventHandlerInit: function(msg){
    // 	var source = new EventSource('/sample_video_stream');
    // 	console.log('event is coming...')
		  // console.log(msg)    	
    // },
  eventHandlerUpdate: function(ev){
      //retrieves the image string from the server and call to draw
      console.log('eventHandling..')
      im_src= ev.data;
    	this.drawSampleImage(im_src)
  },

  centring: function(){
		console.log("centring");
		$.ajax({
        	url: '/centring',
       		data: {'PosX': x, 'PosY': y},
    		type: 'PUT',
        	success: function(res) {
            	console.log(res);
        	},
       		//error: function(error) {
         //		console.log(error);
        //	},
   		});
    },

	snapshot: function(){
		console.log("snapshot");
		//click points will also appear as it is rigth now, the image is automatically downloaded
		var dataURL = document.getElementById('canvas').toDataURL("image/png");
		dataURL = dataURL.replace("image/png", "image/octet-stream");
    document.location.href = dataURL;
    },

	deletePoints: function(){
		console.log("deleting")
		this.setState({pos: []});
    },
  
  zoomLevel: function(ev){
    var e =document.getElementById("zoomSelector");
    var currZoom = e.options[e.selectedIndex].text;
    console.log(currZoom)
    this.setState({zoomText: currZoom})
    $.ajax({
          url: '/mxcube/api/v0.1/samplecentring/zoom/move',
          data: JSON.stringify({'moveable': 'Zoom', 'position': currZoom}, null, '\t'),
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

  lightOn: function(ev){
    console.log("ligth on requested")
    $.ajax({
          url: '/mxcube/api/v0.1/samplecentring/light/move?newpos=1',
          data: {'moveable': 'Light', 'position':1},
        type: 'PUT',
          success: function(res) {
              console.log(res);
          },
          error: function(error) {
            console.log(error);
          },
      });
    },
  lightOff: function(ev){
    console.log("ligth off requested")
    $.ajax({
          url: '/mxcube/api/v0.1/samplecentring/ligth/move?newpos=0',
          data: {'moveable': 'Light', 'position':0},
        type: 'PUT',
          success: function(res) {
              console.log(res);
          },
          error: function(error) {
            console.log(error);
          },
      });
    },
  push: function(id,data){
    console.log("push requested")
    $.ajax({
      url: '/mxcube/api/v0.1/samplecentring/'+id+'/move?newpos='+data,
      data: {'moveable': id, 'position':data}, //not really needed, everything in the url (motor and newpos) 
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
            this.push(ev.target.id,document.getElementById(ev.target.id).value)
      }
         return true;
      },
      
  parseIncDec: function(ev){
      console.log("parsing")
      //any change on the number input fires onChange!@#!!
      //this.push(ev.target.id,document.getElementById(ev.target.id).value)
  },

	render: function () {
    
		console.log('rendering');
	 	return <div>
	 				  <div>
	 					 <canvas id="canvas" height={493} width={659} onClick={this.onClick} />
 					  </div>
            <div>
						  <button onClick={this.centring}>Centring</button>
       			  <button onClick={this.snapshot}>Snapshot</button>
              <button onClick={this.lightOn}>"Light On"</button>
              <button onClick={this.lightOff}>"Light Off"</button>
       			  <button onClick={this.deletePoints}>Delete Points</button> 
              <select id="zoomSelector" onChange={this.zoomLevel} value={this.currZoom}>
                <option value="Zoom 1">Zoom 1</option>
                <option value="Zoom 2">Zoom 2</option>
                <option value="Zoom 3">Zoom 3</option>
                <option value="Zoom 4">Zoom 4</option>
                <option value="Zoom 5">Zoom 5</option>
                <option value="Zoom 6">Zoom 6</option>
                <option value="Zoom 7">Zoom 7</option>
                <option value="Zoom 8">Zoom 8</option>
                <option value="Zoom 9">Zoom 9</option>
                <option value="Zoom 10">Zoom 10</option>
              </select>
              <div className="input-group">
                <span className="input-group-addon" id="basic-addon1">Kappa</span>
                <input type="number" id="Kappa" onKeyPress={this.isNumberKey}/>
              </div>
              <div className="input-group">
                <span className="input-group-addon" id="basic-addon2">Omega</span>
                <input type="number" id="Omega" onKeyPress={this.isNumberKey}/>
              </div>
              <div className="input-group">
                <span className="input-group-addon" id="basic-addon3">Phi</span>
                <input type="number" id="Phi" onKeyPress={this.isNumberKey}/>
              </div>
  				  </div>
     			</div>;
    },
    // componentWillMount: function(){
    //   this.getInitialState();
    // },
    componentDidMount: function(){
    	this.drawSampleImage();
      // this.streamSubscribe();
//    	this.eventHandlerInit()
    	//var source = new EventSource('/mxcube/api/v0.1/samplecentring/camera/stream');
    	//source.addEventListener('update',this.eventHandlerUpdate);
    },

});

React.render(<Sample/>, document.getElementById('SampleCentring'));
