import io from "socket.io-client";
import { addLogRecord } from './actions/logger';


export default class ServerIO{

    constructor(dispatch) {
        this.dispatch = dispatch; 
    }

    listen(){

        const socket =  io.connect('http://' + document.domain + ':' + location.port+"/logging");

        socket.on('log_record', (record) => {
            this.dispatch(addLogRecord(record));
        });

    }

}

