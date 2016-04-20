import io from "socket.io-client";
import { addLogRecord } from './actions/logger';
import { updatePointsPosition, saveMotorPositions } from './actions/sampleview';
//import { doAddTaskResult } from './actions/samples_grid';


export default class ServerIO{

    constructor(dispatch) {
        this.dispatch = dispatch; 
    }

    listen(){
        const socketHWR = io.connect('http://' + document.domain + ':' + location.port+"/hwr");

        const socket =  io.connect('http://' + document.domain + ':' + location.port+"/logging");

        socket.on('log_record', (record) => {
            this.dispatch(addLogRecord(record));
        });

        socketHWR.on('Motors', (record) => {
            this.dispatch(updatePointsPosition(record.CentredPositions));
            this.dispatch(saveMotorPositions(record.Motors));
        });
  
        // socketHWR.on('Task', (record) => {
        //     //console.log(record);
        //     //this.dispatch(doAddTaskResult(record.CentredPositions));
        // });

    }

}

