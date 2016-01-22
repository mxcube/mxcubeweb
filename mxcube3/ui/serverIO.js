import io from "socket.io-client";

console.log("ServerIO");
window.log_records = [];
window.log_records_connect = function() {
    //clearTimeout(window.log_records_keepalive);
    //window.log_records_keepalive = setTimeout(window.log_records_connect, 5*1000); 
    window.log_records_ws = io.connect('http://' + document.domain + ':' + location.port+"/logging");
    window.log_records_ws.on('log_record', (record) => {
        window.log_records.push(record);
        //clearTimeout(window.log_records_keepalive);
        //window.log_records_keepalive = setTimeout(window.log_records_connect, 30*1000);
        if (window.logging_component) { window.logging_component.handle_record(record) }
    })
};
window.log_records_connect();
