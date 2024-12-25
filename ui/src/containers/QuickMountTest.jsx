import React,{useState} from "react";
import {connect} from 'react-redux'
import { reduxForm, formValueSelector,Field } from 'redux-form';
import * as SampleChangerActions from '../actions/sampleChanger';
import { useSelector ,useDispatch} from "react-redux";
import QuickGetSampleListTest from './QuickGetSampleListTest'
import QuickSCCommandTest from './QuickSCCommandTest';
import {selectSamplesAction} from '../actions/sampleGrid'
import * as QueueGUIActions from '../actions/queueGUI';
import {updateTaskData} from '../actions/taskForm'

// import { Button, ButtonToolbar } from 'react-bootstrap';
import {
  sendClearQueue,
  deleteSamplesFromQueue,
  setEnabledSample,
  addSamplesToQueue,
  sendStopQueue,
  deleteTask,
} from '../actions/queue';

import {
  Modal, Button, Form, Row, Col, ButtonToolbar
} from 'react-bootstrap';

import './QuickMountTest.css'
import { useEffect } from "react";
import { prefix } from "@fortawesome/free-brands-svg-icons";

// 验证上样的puck，pin是否输入正确
const validate = (values)=>{
  const errors={};
  if(!values.puck_num){
    errors.puck_num = 'Required';
  }else{
    const puckNumRegex = /^\d{1,2}$/;
    if(!puckNumRegex.test(values.puck_num)){
      errors.puck_num = 'Must be like 1 or 12'
    }
  }
  if(!values.pin_num){
    errors.pin_num = 'Required';
  }else{
    // console.log('pin_num')
    // console.log(values.pin_num)
    const pinNumRegex = /^\d{2}$/;
    if(!pinNumRegex.test(values.pin_num)){
      errors.pin_num = 'Must be like 01'
    }
  }
  // console.log("error");
  // console.log(errors)
  // console.log(typeof(values.pin_num))
  // console.log('typeof')
  return errors;
}

// redux form固定写法
const renderField = ({input,label,type,meta:{touched,error},inputStyle})=>{
  return (
    <>
      <label>{label}</label>
      <input {...input} tyepe={type} style={inputStyle}/>
      {touched && error && <span>{error}</span>}
    </>
  )
}


//初始化各初始值，不用从redux获取的初始值都设为''，
const initialValues={
  puck_num:'1',
  pin_num:'01',
  osc_range:'',
  exp_time:'',
  exp_time_test:'',
  num_images:'',
  num_images_test:'',
  resolution_value : '',
  sub_directory:'',
  prefix:'',
}



const updatePuckPinValues =(puck_num,pin_num) =>{
  let puck_num_local = parseInt(puck_num)
  let pin_num_local = parseInt(pin_num)
  if(pin_num_local<16){
    pin_num_local+=1
    if(pin_num_local<10){
      pin_num_local = '0'+pin_num_local
    }
  }
  else if(pin_num_local==16){
    pin_num_local = '01'
    if(puck_num_local>=1 && puck_num_local<37){
      puck_num_local+=1
    }else if(puck_num_local==37){
      puck_num_local=1
    }
  }
  return [puck_num_local,pin_num_local]
}



const QuickMountTest =(props) =>{

    const dispatch = useDispatch();
    const formSelector = formValueSelector('quickMountTest')



    const { handleSubmit } = props;
    const {initialize,reset} = props

    const {
        loadSample,
        unloadSample
      } = SampleChangerActions;
    const{
      showList,
    } = QueueGUIActions;

    const queue = useSelector((state) => state.queue)
    const sampleList = useSelector((state) => state.sampleGrid.sampleList)
    const sc_state = useSelector((state)=>state.sampleChanger.state)
    const resolution_state = useSelector((state)=>state.beamline.hardwareObjects.resolution)
    // 可以将每个参数都分成 xxx和xxx_test，但没有必要，这里只给一个exp_time的示例
    const exp_time = useSelector((state)=>state.taskForm.defaultParameters.datacollection.acq_parameters.exp_time)
    const exp_time_test = useSelector((state)=>state.taskForm.defaultParameters.datacollectiontest.acq_parameters.exp_time)
    const osc_range = useSelector((state)=>state.taskForm.defaultParameters.datacollection.acq_parameters.osc_range)
    const num_images = useSelector((state)=>state.taskForm.defaultParameters.datacollection.acq_parameters.num_images)
    const num_images_test = useSelector((state)=>state.taskForm.defaultParameters.datacollectiontest.acq_parameters.num_images)

    // const sub_directory = useSelector((state)=>state.taskForm.taskData.parameters.subdir)
    // const prefix = useSelector((state)=>state.taskForm.taskData.parameters.prefix)

    const current = useSelector((state)=>state.queue.current)

    const form_input_puck_num = useSelector((state) => formSelector(state,'puck_num'))
    const form_input_pin_num = useSelector((state) => formSelector(state,'pin_num'))

    
    


    const mountAndSwitchTab =(sampleID)=>{
      const sampleData = sampleList[sampleID]
      dispatch(loadSample(sampleData));   //这里前端就会判断，要上样样品和当前样品是否不同
      dispatch(showList('current'));
    }



    function addSamplesToQueue_not_from_queue_action(sampleIDList) {
      const samplesToAdd = sampleIDList.map((sampleID) => {
        return { ...sampleList[sampleID], checked: true, tasks: [] };
      });
      if (samplesToAdd.length > 0) { dispatch(addSamplesToQueue(samplesToAdd)); }
    }





    const inQueue = (sampleID) =>{
      let result = false
      try{
        result = queue.queue.includes(sampleID) && sampleList[sampleID].checked;
      
      
      }catch(error){
        console.log('sampleID casued Error from inQueue: ')
        console.log(sampleID)
        console.log(error)
        return false
      }
      return result
    }



    const inQueueOrNotAddSamples=(sampleIDList, addSamples) =>{
      /* 
        adapt from inQueueDeleteElseAddSamples
        args: ['1:01'] , true 
      */
      // console.log("inQueueOrNotAddSamples")
      // console.log(sampleIDList)
      const samples = [];
      for (const sampleID of sampleIDList) {
        if (!inQueue(sampleID)) {
          samples.push(sampleID)
        }
  
      if (addSamples && samples.length > 0) { addSamplesToQueue_not_from_queue_action(samples);}
      }
    }







    // 上样后自动更新表格默认值
    // sampleID_input 是输入的样品id值
    const updateDefualtValues=(values,sampleID_input)=>{
      // 上样后表格自动更新下一个样品编号
      let {puck_num,pin_num} = values
      const [puck_num_changed,pin_num_changed] = updatePuckPinValues(puck_num,pin_num)

      props.change('puck_num',puck_num_changed)
      props.change('pin_num',pin_num_changed)
      const sampleData = sampleList[sampleID_input]

      props.change('sub_directory',sampleData.defaultSubDir)
      props.change('prefix',sampleData.defaultPrefix)

      
    }



    // const updateTaskFormValue = ()=>{
    //   const {sampleID} = queue.current  //结构赋值
    //   console.log("get sampleID from queue.control")
    //   console.log(sampleID)
    //   dispatch(updateTaskData(
    //     [sampleID],
    //     {
    //       parameters:
    //       {
    //         prefix: sampleData.defaultPrefix,
    //         subdir: `${this.props.groupFolder}${sampleData.defaultSubDir}`,
    //       },
    //       type,
    //     },
    //   ));

    // }

    const mount = () => {
      handleSubmit((values)=>{
        console.log(sc_state)
        const samples = []
        // console.log('Submitted values:', values);
        const puck_num_input = values['puck_num']
        const pin_num_input = values['pin_num']
        const sampleID_input = puck_num_input+':'+pin_num_input
        // console.log(sampleID_input)
  
        samples.push(sampleID_input)
        
        dispatch(selectSamplesAction(samples))
        inQueueOrNotAddSamples(samples,true)
  
        updateDefualtValues(values,sampleID_input)
        mountAndSwitchTab(sampleID_input)   // 此处调用真实上样函数
        // console.log('mount 函数走完!!!!!!!!!!!!!!!!!!!!!!')
      })() //这里一对空阔号代表真实被调用，不加不会被调用
    };

    const unmount = ()=>{
      dispatch(unloadSample(''))
    }



    // 恢复默认值
    const resetToDefaults =(collect_method)=>{
      let num_images_init = 1
      if (collect_method === 'test'){
        num_images_init = num_images_test
      }
      else if (collect_method === 'data_collection'){
        num_images_init = num_images
      }

      const sampleData = sampleList[current.sampleID]
      if (typeof sampleData === 'undefined'){
        console.log('the sampleData is undefined')
        initialize(
          {
            ...initialValues,
            num_images : num_images_init,
            resolution_value:resolution_state.value,
            exp_time:exp_time_test,
            osc_range : osc_range,


          }
        )
      }
      else{
        console.log("the sampleData is :")
        console.log(sampleData)
        console.log(sampleData.defaultSubDir)
        // console.log(sampleData.sampleID)
        // console.log(typeof(sampleData.sampleID)) //string
        const sampleData_sampleID = (sampleData.sampleID).split(':')
        const sampleData_sampleID_puck_num = sampleData_sampleID[0]
        const sampleData_sampleID_pin_num = sampleData_sampleID[1]
        const [puck_num_changed,pin_num_changed] = updatePuckPinValues(sampleData_sampleID_puck_num,sampleData_sampleID_pin_num)


        initialize(
          {
            ...initialValues,
            num_images : num_images_init,
            resolution_value:resolution_state.value,
            exp_time:exp_time_test,
            osc_range : osc_range,
            sub_directory: sampleData.defaultSubDir,
            prefix: sampleData.defaultPrefix,
            puck_num :puck_num_changed,
            pin_num :pin_num_changed,
          }
        )
        // reset()    //reset也是一个重置函数，但此处不用

      }

      

    }


    return (
        <>
          <Row>
            <Col xs={3}>step 1:</Col>

            <Col>step 2:</Col>

          </Row>
          <Row>
            <Col xs={3}>
              <QuickGetSampleListTest/>
            </Col>
            <Col>
              <QuickSCCommandTest 
                command={'closelid1'}
                sc_state={sc_state}
              />
            </Col>

          </Row>
          <br/>

          step 3:

          {/* 上样的表格 */}
          <Form onSubmit={handleSubmit}>
          {/* <Form onSubmit={handleSubmit(mount)}> */}
          {/* <form onSubmit={handleSubmit(dispatch(loadSample))}> */}

            <Row>
              <Col xs={3}>
                <label htmlFor="puck_num">puck：</label>
              </Col>
              <Col >
                <Field name="puck_num" component={renderField} type="text" />
              </Col>
            </Row>
            <Row>
              <Col xs={3}>
                <label htmlFor="pin_num">pin：</label>
              </Col>
              <Col>
                <Field name="pin_num" component={renderField} type="text" />
              </Col>
            </Row>

            {/* <Button type="submit" disabled={sc_state=='READY'?false:true} >Mount</Button> */}
            <Button type="button" disabled={sc_state==='READY'?false:true} onClick={mount} className="button-space">Mount</Button>
            <Button type="button" disabled={sc_state==='READY'?false:true} onClick={unmount} >Unmount</Button>


            <br/>
          
            {/* 下面是收集的具体参数 */}
            step 4:
 

            <Row>
              <Col xs={3}>
                <label htmlFor="sub_directory">Subdirectory :</label>
              </Col>
              <Col >
                <Field name="sub_directory" component={renderField} type="text" inputStyle={{width:'500px'}}/>
              </Col>
        
            </Row>
            <Row>
              <Col xs={3}>
                <label htmlFor="prefix">Prefix :</label>
              </Col>
              <Col>
                <Field name="prefix" component={renderField} type="text" inputStyle={{width:'500px'}} />
              </Col>
            </Row>
            <br/>
            <Row>
              <Col xs={2}>
                <label htmlFor="osc_range">Range:</label>
              </Col>
              <Col>
                <Field name="osc_range" component={renderField} type="text" inputStyle={{width:'170px'}}/>
              </Col>
              <Col xs={2}>
                <label htmlFor="num_images">Number:</label>
              </Col>
              <Col>
                <Field name="num_images" component={renderField} type="text" inputStyle={{width:'170px'}}/>
              </Col>
            </Row>

            <Row>
              <Col xs={2} >
                <label htmlFor="exp_time">Exposure:</label>
              </Col>
              <Col>
                <Field name="exp_time" component={renderField} type="text" inputStyle={{width:'170px'}}/>
              </Col>
              <Col xs={2}>
                <label htmlFor="resolution_value">Resolution:</label>
              </Col>
              <Col>
                <Field name="resolution_value" component={renderField} type="text" inputStyle={{width:'170px'}} value='1.38'/>
              </Col>
            </Row>

            <br/>
            <Button type="button"  onClick={()=>resetToDefaults('test')} className="button-reset-default">Default value (test)</Button>
            <Button type="button"  onClick={()=>resetToDefaults('data_collection')} className="button-reset-default">Defulat value</Button>
            <br/>
            <Button type="button" disabled={sc_state==='READY'?false:true} onClick={null} className="button-admit">Collect</Button>
            <Button type="button" disabled={sc_state==='READY'?false:true} onClick={null} className="button-admit">test 1 image</Button>
            <Button type="button" disabled={sc_state==='READY'?false:true} onClick={null} className="button-admit">test 4 images</Button>
          </Form>


          <Col xs={3}>

          </Col>
          <br/>
        </>

    );


}


const mapStateToProps=(state)=>{
  return {

    initialValues:{
      ...initialValues,
      resolution_value: (state.taskForm.sampleIds.constructor !== Array
        ? state.taskForm.taskData.parameters.resolution
        : state.beamline.hardwareObjects.resolution.value),
      exp_time : state.taskForm.defaultParameters.datacollection.acq_parameters.exp_time,
      // exp_time_test : state.taskForm.defaultParameters.datacollectiontest.acq_parameters.exp_time,
      osc_range : state.taskForm.defaultParameters.datacollection.acq_parameters.osc_range,
      num_images : state.taskForm.defaultParameters.datacollection.acq_parameters.num_images,
      // num_images_test : state.taskForm.defaultParameters.datacollectiontest.acq_parameters.num_images,
      // sub_directory : 
    },


    

    
    
  }
}


export default connect(mapStateToProps)(
  reduxForm({
    form: 'quickMountTest',
   
    validate
})(QuickMountTest));


