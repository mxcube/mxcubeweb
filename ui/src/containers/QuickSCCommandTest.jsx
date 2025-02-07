// import {
//     sendGetSampleList,
//     sendGetSampleListReWrite,
//   } from '../actions/sampleGrid';


import React from "react";
import { useSelector ,useDispatch} from "react-redux";
import { Button, ButtonToolbar } from 'react-bootstrap';
import {
    select, loadSample, unloadSample, scan, abort, sendCommand, refresh
  } from '../actions/sampleChanger'




function QuickSCCommandTest({command,sc_state}) {
    const dispatch = useDispatch();

    const closeLid =()=>{
        console.log("close lid")
        dispatch(sendCommand(command));      // 不加这一句，就会报错  Move arrow function 'getSampleList' to the outer scope
    };



    return (
        <>
            <div>
                <Button type="button" disabled={sc_state==='READY'?false:true} onClick={closeLid}>close lid</Button>
            </div>
        </>

    )


}



export default QuickSCCommandTest;