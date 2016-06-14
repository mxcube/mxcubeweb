import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { StickyContainer, Sticky } from 'react-sticky';

import {
  Input,
  Button,
  Glyphicon,
  ButtonToolbar,
  SplitButton,
  MenuItem,
  ButtonGroup
} from 'react-bootstrap';

import {
  sendGetSampleListRequest,
  toggleSelectedAction,
  pickAllAction,
  filterAction,
  sendSyncSamplesRequest,
  sendManualMountRequest,
  sendDeleteSampleTask,
  toggleMovableAction,
  setSampleOrderAction,
  selectAction,
  pickSelectedAction
} from '../actions/SamplesGrid';


import { sendAddSample } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';
import SampleTaskButtons from '../components/SampleGrid/TaskButtons';

import SampleGrid from '../components/SampleGrid/SampleGrid';
import { SAMPLE_ITEM_WIDTH, SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';
import '../components/SampleGrid/SampleGrid.css';


class SampleGridContainer extends React.Component {

  constructor(props) {
    super(props);
    this.syncSamples = this.syncSamples.bind(this);
    this.addSamples = this.addSamples.bind(this);
    this.showAddSample = props.showTaskParametersForm.bind(this, 'AddSample');
    this.manualMount = this.manualMount.bind(this);
    this.filterSampleGrid = this.filterSampleGrid.bind(this);
  }


  addSamples() {
    // Loop through all samples, check which was selected and add to the queue.
    Object.keys(this.props.samplesList).forEach(key => {
      if (this.props.selected[key]) {
        this.props.addSampleToQueue(key);
      }
    });

    this.props.unselectAll();
  }


  syncSamples() {
    let proposalId;

    try {
      proposalId = this.props.loginData.session.proposalId;
    } catch (e) {
      return;
    }

    this.props.syncSamples(proposalId);
  }


  manualMount() {
    this.props.setManualMount(!this.props.manualMount);
  }


  filterSampleGrid(option) {
    this.props.filter(option.target.value);
  }

  
  calcGridWidth() {
    // We know that the side menu is fixed width 65px and that the padding from
    // bootstrap is 15px so content starts at 80px;

    // Get the viewportWidth
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)

    // The full content width for this media (not forgeting the padding to the right 15px)
    const fullContentWidth = viewportWidth - 80 - 15

    // Each sample item is 190px wide, calculate maximum number of items for each row
    const numCols = Math.floor(fullContentWidth / SAMPLE_ITEM_WIDTH);

    // Caculating the actual grid size, with space between sample items;
    const actualGridWidth = numCols * (SAMPLE_ITEM_WIDTH + 2 + SAMPLE_ITEM_SPACE) + 10;

    return actualGridWidth;
  }
  

  render() {   
    const gridWidth = this.calcGridWidth();
    const innerSearchIcon = (
      <Button><Glyphicon glyph="search" /></Button>
    );

   const panelHeader = (
     <div> Pipline mode <Glyphicon className="pull-right" glyph="chevron-down" /></div>
   );


   return (
       <StickyContainer>
         <div className="row row-centered">
           <div className="col-centered" >
             <ButtonToolbar>
               <SplitButton
                 bsStyle="primary"
                 title={this.props.manualMount ? 'Manual Mount' : 'Check sample changer contents'}
                 onClick={this.props.manualMount ? this.showAddSample : this.props.getSamples}
                 onSelect={this.manualMount}
                 id="split-button-sample-changer-selection"
               >
                 <MenuItem eventKey="1">
                   {this.props.manualMount ? 'Sample changer' : 'Manual mount'}
                 </MenuItem>
               </SplitButton>
               <Button
                 className="btn-primary"
                 disabled={this.props.manualMount}
                 onClick={this.syncSamples}
               >
                 <Glyphicon glyph="refresh" /> Sync. ISPyB
               </Button>
             </ButtonToolbar>
           </div>
         </div>
         <Sticky className="samples-grid-header" style={{width: gridWidth}} stickyStyle={{padding:'10px'}}>
           <div className="row">
             <div className="col-xs-5">
               <div className="form-inline">
                 <Input
                   type="text"
                   ref="filter_input"
                   defaultValue={this.props.filterText}
                   label="Filter:"
                   buttonAfter={innerSearchIcon}
                   onChange={this.filterSampleGrid}
                 />
                 <span style={{'margin-left': '10px'}}>Pick: </span>
                 <ButtonGroup className="form-group">
                   <Button
                     onClick={this.props.selectAll}
                     disabled={this.props.manualMount}
                   >
                     All
                   </Button>
                   <Button
                     onClick={this.props.pickSelected}
                     disabled={this.props.manualMount}
                   >
                     Selected
                   </Button>
                   <Button
                     onClick={this.props.unselectAll}
                     disabled={this.props.manualMount}
                   >
                     None
                   </Button>
                 </ButtonGroup>
               </div>      
             </div>
             <div className="col-xs-2 pull-right">
               <SampleTaskButtons 
                 defaultParameters={this.props.defaultParameters}
                 showForm={this.props.showTaskParametersForm}
                 selected={this.props.selected}
               />
               <Button className="btn btn-success pull-right" href="#/datacollection">
                 Collect <Glyphicon glyph="chevron-right" />
               </Button>
             </div>
           </div>
         </Sticky>
         <br />
         <div className="row">
           <div className="col-xs-12">
             <SampleGrid
               sampleList={this.props.sampleList}
               order={this.props.order}
               setSampleOrder={this.props.setSampleOrderAction}
               selected={this.props.selected}
               toggleSelected={this.props.toggleSelected}
               filterText={this.props.filterText}
               queue={this.props.queue}
               showTaskParametersForm={this.props.showTaskParametersForm}
               deleteTask={this.props.deleteTask}
               toggleMovable={this.props.toggleMovableAction}
               moving={this.props.moving}
               gridWidth={gridWidth}
               picked={this.props.picked}
               select={this.props.select}
               pickSelected={this.props.pickSelected}
             />
           </div>
         </div>
     </StickyContainer>);
  }
}

function mapStateToProps(state) {
  return {
    loginData: state.login.data,
    queue: state.queue,
    selected: state.samples_grid.selected,
    moving: state.samples_grid.moving,
    sampleList: state.samples_grid.sampleList,
    defaultParameters: state.taskForm.defaultParameters,
    manualMount: state.samples_grid.manualMount.set,
    filterText: state.samples_grid.filterText,
    order: state.samples_grid.order,
    picked: state.samples_grid.picked
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleListRequest()),
    setSampleOrderAction: (order, key, newPos) => dispatch(setSampleOrderAction(order, key, newPos)),
    toggleSelected: (index) => dispatch(toggleSelectedAction(index)),
    selectAll: () => dispatch(pickAllAction(true)),
    unselectAll: () => dispatch(pickAllAction(false)),
    filter: (filterText) => dispatch(filterAction(filterText)),
    syncSamples: (proposalId) => dispatch(sendSyncSamplesRequest(proposalId)),
    addSampleToQueue: (id) => dispatch(sendAddSample(id)),
    setManualMount: (manual) => dispatch(sendManualMountRequest(manual)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: (parentId, queueId, sampleId) => {
      dispatch(sendDeleteSampleTask(parentId, queueId, sampleId));
    },
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    select: (keys) => dispatch(selectAction(keys)),
    pickSelected: () => dispatch(pickSelectedAction())
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

