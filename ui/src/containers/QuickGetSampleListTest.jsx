import {
    sendGetSampleList,
    sendGetSampleListReWrite,
  } from '../actions/sampleGrid';


import React from "react";
import { useSelector ,useDispatch} from "react-redux";
import { Button, ButtonToolbar } from 'react-bootstrap';





function QuickGetSampleListTest() {
    const dispatch = useDispatch();

    const getSampleList =()=>{
        console.log("get sample list")
        dispatch(sendGetSampleListReWrite());      // 不加这一句，就会报错  Move arrow function 'getSampleList' to the outer scope
    };



    return (
        <>
            <div>
                <Button onClick={getSampleList}>get Sample list</Button>
            </div>
        </>

    )


}



export default QuickGetSampleListTest;