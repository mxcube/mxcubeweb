import React,{useState} from "react";
import {connect} from 'react-redux'
import { reduxForm, formValueSelector,Field } from 'redux-form';
import * as SampleChangerActions from '../actions/sampleChanger';
import * as SampleViewActions from '../actions/sampleview';
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


const everpolate = require('everpolate');

// 验证上样的puck，pin等参数是否输入正确
const validate = (values,props)=>{

  const emptyField = 'field is empty';

  console.log('prosp in validate')
  console.log(props)
  const errors={};

  // 准备工作_resolution 验证 (由validate.js源代码改写而来)
  const currEnergy = Number.parseFloat(props.beamline.hardwareObjects.energy.value);
  const currRes = Number.parseFloat(values.resolution_value);
  console.log('values.energy and values.resolution in validate() in Quickountest.jsx')
  console.log(currEnergy,currRes)

  const energies = props.beamline.hardwareObjects.resolution.limits.map(value => value[0]);
  const limitsMin = props.beamline.hardwareObjects.resolution.limits.map(value => value[1]);
  const limitsMax = props.beamline.hardwareObjects.resolution.limits.map(value => value[2]);

  let resMin = 0;
  let resMax = 0;

  if (energies.length > 2) {
    resMin = everpolate.linear(currEnergy, energies, limitsMin);
    resMax = everpolate.linear(currEnergy, energies, limitsMax);
  } else {
    resMin = props.beamline.hardwareObjects.resolution.limits[0];
    resMax = props.beamline.hardwareObjects.resolution.limits[1];
  }




  // 开始验证




  // 验证puck_num
  if(!values.puck_num){
    errors.puck_num = 'Required';
  }else{
    const puckNumRegex = /^\d{1,2}$/;
    if(!puckNumRegex.test(values.puck_num)){
      errors.puck_num = 'Must be like 1 or 12'
    }else{
      if (values.puck_num<1 || values.puck_num>37){
        errors.puck_num = 'Must between 0 ~ 37'
      }
    }
  }

  // 验证pin_num
  if(!values.pin_num){
    errors.pin_num = 'Required';
  }else{
    // console.log('pin_num')
    // console.log(values.pin_num)
    const pinNumRegex = /^\d{1,2}$/;
    if(!pinNumRegex.test(values.pin_num)){
      errors.pin_num = 'Must be like 1 or 12'
    }
    else{
      if(values.pin_num<1 || values.pin_num>16){
        errors.pin_num = 'Must between 0 ~ 16'
      }
    }
  }


  // 验证subdirectory
  const subdirRegex = /^[-\w\-\/\_\{\}]+$/;
  if(values.sub_directory===''){
    errors.sub_directory = emptyField;
  }else if (!subdirRegex.test(values.sub_directory)){
    errors.sub_directory = 'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }


  // 验证prefix
  const prefixRegex = /^[-\w\-\#\_\{\}\[\]]+$/;
  if(values.prefix===''){
    errors.prefix = emptyField;
  }else if (!prefixRegex.test(values.prefix)){
    errors.prefix = 'Invalid character in path, only alphanumerical characters and -, _, : allowed';
  }



  // 验证range,(由validate.js源代码改写而来)
  // console.log('props.acqParametersLimits.osc_range')
  // console.log(props.acqParametersLimits.osc_range)
  const osc_range_Regex = /(^[1-9]\d*\.?\d*)$|(^0\.\d*[1-9])$/
  if (values.osc_range === '') {
    errors.osc_range = emptyField;
  }else if (!osc_range_Regex.test(values.osc_range)){
    errors.osc_range = 'must be numbers';
  }else{
    if (Number.parseInt(values.osc_range, 10) > props.acqParametersLimits.osc_range
      || Number.parseFloat(values.osc_range, 10) < 0) {
      errors.osc_range = 'wrong value';
    }
    if (values.osc_range * values.num_images > props.acqParametersLimits.osc_max) {
      errors.osc_range = 'Omega out of limits';
      errors.num_images = 'Omega out of limits';
    }
  }



  // 验证exposure
  const exp_time_Regex = /(^[1-9]\d*\.?\d*)$|(^0\.\d*[1-9])$/;
  if (values.exp_time === ''){
    errors.exp_time = emptyField;
  }else if (!exp_time_Regex.test(values.exp_time)){
    errors.exp_time = 'Must be numbers';
  }else{
    if (props.acqParametersLimits.exposure_time) {
      const exptimemin = props.acqParametersLimits.exposure_time[0];
      const exptimemax = props.acqParametersLimits.exposure_time[1];
      if (Number.parseFloat(values.exp_time, 10) > exptimemax || Number.parseFloat(values.exp_time, 10) < exptimemin) {
        errors.exp_time = 'Entered Exposure time out of allowed limit';
      }
    }
  }


  // 验证num_images
  if (Number.parseInt(values.num_images, 10) > props.acqParametersLimits.number_of_images
    || Number.parseInt(values.num_images, 10) < 1) {
    errors.num_images = 'Entered Number of images out of allowed range';
  }else if (values.num_images === '') {
    errors.num_images = emptyField;
  }else {
    const num_img_Regex = /^\d+$/;
    if(!num_img_Regex.test(values.num_images)){
      errors.num_images = 'Must be numbers'
    }
  }

  // 验证resolution,其实不需要正则表达式判断数字，上面已经强转类型了,若不是数字直接是NaN，也会报错
  // const resRegex = /(^[1-9]\d*\.？\d*)|(^0\.\d*[1-9])$/;
  const resRegex = /(^[1-9]\d*\.?\d*)$|(^0\.\d*[1-9])$/;
  if (values.resolution_value === '') {
    errors.resolution_value = emptyField;
  }else if(!resRegex.test(values.resolution_value)){
    errors.resolution_value = 'Must be numbers'
  }else if(!(currRes >= resMin && currRes <= resMax)) {
    errors.resolution_value = 'Entered Resolution outside working range';
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
    
    const {
      generatePointInScreenCenter,
    } = SampleViewActions;

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
    const groupFolder = useSelector((state)=>state.queue.groupFolder)

    // const form_input_puck_num = useSelector((state) => formSelector(state,'puck_num'))
    // const form_input_pin_num = useSelector((state) => formSelector(state,'pin_num'))

    const sampleIds = useSelector((state)=>state.taskForm.sampleIds)
    const taskData = useSelector((state)=>state.taskForm.taskData)



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
      // sampleData 的获取方式和SampleViewContainer.js一样
      const sampleData = sampleList[sampleID_input]

      props.change('sub_directory',`${groupFolder}${sampleData.defaultSubDir}`)
      props.change('prefix',sampleData.defaultPrefix)


    }


    const generatePoint  =()=>{
      dispatch(generatePointInScreenCenter())
    }

    const mount = () => {
      handleSubmit((values)=>{
        console.log('sc_state:')
        console.log(sc_state)
        const samples = []
        // console.log('Submitted values:', values);
        const puck_num_input = values['puck_num']
        let pin_num_input = values['pin_num']

        const pinNumRegex_if_XX = /^\d{2}$/;

        if (!pinNumRegex_if_XX.test(pin_num_input)){
          pin_num_input = '0' + pin_num_input

        }




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
            exp_time:exp_time,
            osc_range : osc_range,
            sub_directory : 'wait_to_mount',
            prefix    : 'wait_to_mount',

          }
        )
      }
      else if(sampleData.location === 'Manual'){
        initialize(
          {
            ...initialValues,
            num_images : num_images_init,
            resolution_value:resolution_state.value,
            exp_time:exp_time,
            osc_range : osc_range,
            sub_directory: `${groupFolder}${sampleData.defaultSubDir}`,
            prefix: sampleData.defaultPrefix,
            puck_num :'1',
            pin_num :'01',
          }
        )
      }
      else{
        // console.log("the sampleData is :")
        // console.log(sampleData)
        // console.log(sampleData.defaultSubDir)
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
            exp_time:exp_time,
            osc_range : osc_range,
            sub_directory: `${groupFolder}${sampleData.defaultSubDir}`,
            prefix: sampleData.defaultPrefix,
            puck_num :puck_num_changed,
            pin_num :pin_num_changed,
          }
        )
        // reset()    //reset也是一个重置函数，但此处不用

      }



    }


    // 更新此表单的数据到原版的 datacollection 表单
    const updateTaskDataOfTaskForm = () =>{
      handleSubmit((values)=>{
        console.log('sampleIds')
        console.log(sampleIds)
        // console.log('taskData,typeof(taskData.parameters)')
        // console.log(taskData.parameters)
        // console.log(typeof(taskData.parameters))        
        const taskData_about_change = {
          parameters:{
            ...taskData.parameters,
            subdir :  values['sub_directory'],
            prefix : values['prefix'],
            osc_range : values['osc_range'],
            num_images : values['num_images'],
            exp_time : values['exp_time'],
            resolution : values['resolution_value'],
          }
        }


        dispatch(updateTaskData(sampleIds,taskData_about_change))

      })() //这里一对空阔号代表真实被调用，不加不会被调用
    }

    return (
        <>
          <Row>
            <Col xs={3}>step 1:</Col>

            <Col >
              step 2:
              <span style={{color:'red'}}>
              （click only when robot not in freeze position）
              </span>
            </Col>

          </Row>
          <Row>
            <Col xs={3}>
              <QuickGetSampleListTest/>
            </Col>
            <Col>
              <QuickSCCommandTest
                command={'park'}
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

      
            step 5:
            <br/>
            <Button type="button" onClick={updateTaskDataOfTaskForm} className="button-admit">update</Button>
            <Button type="button" onClick={generatePoint} className="button-admit">generate point</Button>
            {/* <Button type="button" disabled={sc_state==='READY'?false:true} onClick={null} className="button-admit">Collect</Button> */}
            {/* <Button type="button" disabled={sc_state==='READY'?false:true} onClick={null} className="button-admit">test 1 image</Button> */}
            {/* <Button type="button" disabled={sc_state==='READY'?false:true} onClick={null} className="button-admit">test 4 images</Button> */}
            <br/>
            <br/>
            <Button type="button"  onClick={()=>resetToDefaults('test')} className="button-reset-default">Default value (test)</Button>
            <Button type="button"  onClick={()=>resetToDefaults('data_collection')} className="button-reset-default">Defulat value</Button>
            <br/>

          </Form>


          <Col xs={3}>

          </Col>
          <br/>
        </>

    );


}


const mapStateToProps=(state)=>{
  // 下面的type如果从taskForm里面获取，是各种收集模式，有datacollection, datacollectionTest等，是什么取决于上次收集的模式
  // const { type } = state.taskForm.taskData;
  // console.log('type of QiuckMountTest.jsx')
  // console.log(type)


  // 这里直接默认 datacollection
  const type = 'datacollection'
  const {limits} = state.taskForm.defaultParameters[type.toLowerCase()];



  return {

    initialValues:{
      ...initialValues,
      // 还没上样，没有taskData/aprameter，但此组件在还没上样时就要被渲染，因此不能像下面这样去判断
      // resolution_value: (state.taskForm.taskData.parameters.resolution
      //   ? state.taskForm.taskData.parameters.resolution
      //   : state.beamline.hardwareObjects.resolution.value),
      resolution_value:state.beamline.hardwareObjects.resolution.value,
      exp_time : state.taskForm.defaultParameters.datacollection.acq_parameters.exp_time,
      // exp_time_test : state.taskForm.defaultParameters.datacollectiontest.acq_parameters.exp_time,
      osc_range : state.taskForm.defaultParameters.datacollection.acq_parameters.osc_range,
      num_images : state.taskForm.defaultParameters.datacollection.acq_parameters.num_images,
      // num_images_test : state.taskForm.defaultParameters.datacollectiontest.acq_parameters.num_images,

    },
    beamline: state.beamline,
    acqParametersLimits: limits,





  }
}


export default connect(mapStateToProps)(
  reduxForm({
    form: 'quickMountTest',

    validate
})(QuickMountTest));


