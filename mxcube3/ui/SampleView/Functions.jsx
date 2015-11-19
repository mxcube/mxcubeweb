var _ = require('underscore');
var Backbone = require('backbone');
console.log('dispatcher going to start');
window.app_dispatcher = _.extend({}, Backbone.Events);
console.log('dispatcher done');

$(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();  
        // var socket = io.connect('http://' + document.domain + ':' + location.port+'/test');// + namespace);
        // socket.on('connect', function() {
        //     socket.emit('my event', {data: 'I\'m connected!'});
        // });
        // socket.emit('my event', {data: '#emit_data'}); 
        // socket.on('newSignal', function(msg) {
        //     console.log('message received')
        //     var d = new Date()
        //     $('#log').append('<br>'+d.toLocaleString()+ '  #' +msg['sender']+'::'+msg['signal']+ '::Data: '+msg['data'] );
        //     if(msg['signal'] == 'centringSuccessful'){
        //         $("#Modal_Centring").find('p').html('<p>'+msg['signal']+'</p>')
        //         $('#Modal_Centring').modal('show')
        //     };
        //     console.log(msg)
        // });
    });


