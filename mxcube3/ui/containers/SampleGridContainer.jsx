import React from 'react';

import { StickyContainer, Sticky } from 'react-sticky';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Input, Button, Glyphicon, ButtonToolbar, SplitButton, MenuItem } from 'react-bootstrap';
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll, doFilter, 
         doSyncSamples, sendManualMount, doUnselectAll, sendDeleteSampleTask, 
         doReorderSample, toggleMoveable } from '../actions/samples_grid';

import { sendAddSample } from '../actions/queue';
import { showTaskForm } from '../actions/taskForm';

import SampleGrid from '../components/SampleGrid/SampleGrid';
import SampleTaskButtons from '../components/SampleGrid/TaskButtons';
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
    this.props.sendManualMount(!this.props.manualMount);
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

    // Caculating the actual grid size, space between sample items is 4px;
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
               <ButtonToolbar style={{'margin-left': '10px'}} className="form-group">
                 <Button
                   className="btn"
                   onClick={this.props.unselectAll}
                   disabled={this.props.manualMount}
                 >
                   Unselect all
                 </Button>
                 <Button
                   className="btn"
                   onClick={this.props.selectAll}
                   disabled={this.props.manualMount}
                 >
                   Select all
                 </Button>
               </ButtonToolbar>
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
               samples_list={this.props.samplesList}
               sampleOrder={this.props.sampleOrder}
               reorderSample={this.props.reorderSample}
               selected={this.props.selected}
               toggleSelected={this.props.toggleSelected}
               filter_text={this.props.filterText}
               queue={this.props.queue}
               showTaskParametersForm={this.props.showTaskParametersForm}
               deleteTask={this.props.deleteTask}
               toggleMoveable={this.props.toggleMoveable}
               moving={this.props.moving}
               gridWidth={gridWidth}
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
    samplesList: state.samples_grid.samples_list,
    defaultParameters: state.taskForm.defaultParameters,
    manualMount: state.samples_grid.manualMount.set,
    filterText: state.samples_grid.filter_text,
    sampleOrder: state.samples_grid.sampleOrder
  };
}

function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(doGetSamplesList()),
    reorderSample: (sampleOrder, key, newPos) => dispatch(doReorderSample(sampleOrder, key, newPos)),
    toggleSelected: (index) => dispatch(doToggleSelected(index)),
    selectAll: () => dispatch(doSelectAll()),
    unselectAll: () => dispatch(doUnselectAll()),
    filter: (filterText) => dispatch(doFilter(filterText)),
    syncSamples: (proposalId) => dispatch(doSyncSamples(proposalId)),
    addSampleToQueue: (id) => dispatch(sendAddSample(id)),
    sendManualMount: (manual) => dispatch(sendManualMount(manual)),
    updateSamples: (samplesList) => dispatch(doUpdateSamples(samplesList)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: (parentId, queueId, sampleId) => {
      dispatch(sendDeleteSampleTask(parentId, queueId, sampleId));
    },
    toggleMoveable: (key) => dispatch(toggleMoveable(key))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);

