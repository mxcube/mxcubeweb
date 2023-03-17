import React from 'react';
import withRouter from '../components/WithRouter'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Table, OverlayTrigger,
  Tooltip, Button, Dropdown
} from 'react-bootstrap';

import Collapsible from 'react-collapsible';

import "react-contexify/dist/ReactContexify.css";

import { MdRemove, MdFlare, Md360 } from "react-icons/md";
import { BsSquare, BsCheck2Square, BsDashSquare, BsChevronUp, BsChevronDown} from "react-icons/bs";

import { BiMenu } from "react-icons/bi";

import MXContextMenu from '../components/GenericContextMenu/MXContextMenu'

import classNames from 'classnames';

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


import { QUEUE_STOPPED, QUEUE_RUNNING, isCollected, hasLimsData } from '../constants';

import { toggleMovableAction,
  selectSamplesAction,
  sendSetSampleOrderAction, showGenericContextMenu } from '../actions/sampleGrid';

import { deleteTask, addSampleAndMount } from '../actions/queue';

import { unloadSample } from '../actions/sampleChanger';

import { showTaskForm } from '../actions/taskForm';

import { showDialog } from '../actions/general';


import SampleFlexView from './SampleFlexView';

import { SampleGridTableItem } from '../components/SampleGrid/SampleGridTableItem';

import { TaskItem } from '../components/SampleGrid/TaskItem';

class SampleGridTableContainer extends React.Component {

  constructor(props) {
    super(props);
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onScroll = this.onScroll.bind(this);

    this.filter = this.filter.bind(this);
    this.mutualExclusiveFilterOption = this.mutualExclusiveFilterOption.bind(this);
    this.sampleGridItemsSelectedHandler = this.sampleGridItemsSelectedHandler.bind(this);
    this.inQueueSampleID = this.inQueueSampleID.bind(this);

    this.pickAllPuckItemsOnClick = this.pickAllPuckItemsOnClick.bind(this);
    this.pickAllCellItemsOnClick = this.pickAllCellItemsOnClick.bind(this);

    this.currentSample = this.currentSample.bind(this);
    this.getSampleTable = this.getSampleTable.bind(this);
    this.getSampleItems = this.getSampleItems.bind(this);

    this.getSampleListBydCell = this.getSampleListBydCell.bind(this);
    this.getSamplesList = this.getSamplesList.bind(this);

    this.displayContextMenu = this.displayContextMenu.bind(this);
    this.displayPuckCellContextMenu = this.displayPuckCellContextMenu.bind(this);

    this.selectItemUnderCursor = this.selectItemUnderCursor.bind(this);
    this.sampleItemPickButtonOnClickHandler = this.sampleItemPickButtonOnClickHandler.bind(this);
    this.sampleItemIsSelected = this.sampleItemIsSelected.bind(this);

    this.taskItemDeleteButtonOnClickHandler = this.taskItemDeleteButtonOnClickHandler.bind(this);
    this.taskItemOnClickHandler = this.taskItemOnClickHandler.bind(this);

    this.showRubberBand = false;
    this.sampleItems = [];
    this.workflowMenuOptions = this.workflowMenuOptions.bind(this);
    this.mountAndCollect = this.mountAndCollect.bind(this);
    this.unmount = this.unmount.bind(this);

  }


  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('click', this.onClick, false);
    window.addEventListener('scroll', this.onScroll);
    
    if(this.getSampleTable(this.props).length === 0) {
      this.props.setViewMode('Card View', false);
    } else {
      this.props.setViewMode(this.props.viewMode.mode, true);
    }
  }


  shouldComponentUpdate(nextProps) {
    return this.props.queue.queue !== nextProps.queue.queue ||
           Object.keys(this.props.sampleList) !== Object.keys(nextProps.sampleList) ||
           this.props.order !== nextProps.order;
  }


  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('click', this.onClick);
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll(event) {
    event.stopImmediatePropagation()
  }


  /**
  * Handles selection of SampleItems
  *
  * @property {Object} selected
  *
  * @param {MouseEvent} e
  * @param {array} sampleIDlist - array of sampleIDs to select
  *
  * return {boolean} true if item is to be included otherwise false
  */
  sampleGridItemsSelectedHandler(e, sampleIDList) {
    const alreadySelected = sampleIDList.length === 1 && this.sampleItemIsSelected(sampleIDList[0]);
    let samplesToSelect = sampleIDList;

    // We dont want to do anything here if sample is already selected and
    // the right button was clicked. This allows for the context menu to be
    // used on several samples at once. Otherwise just do the select magic.
    if (!(alreadySelected && e.button === 2)) {
      // CTRL key is pressed just modify the current selection, remove already
      // selected and add new ones.
      if (e.ctrlKey) {
        const intersection = new Set(sampleIDList.filter((sampleID) => (
          this.sampleItemIsSelected(sampleID)
        )));

        const union = Object.keys(this.props.selected).concat(sampleIDList);
        samplesToSelect = union.filter((sampleID) => !intersection.has(sampleID));
      }

      this.props.selectSamples(samplesToSelect);
    }
  }


  /**
   * Checks if the two DOMElements el1 and el2 overlap
   *
   * @param {DOMElement} el1
   * @param {DOMElement} el2
   * @return {boolean}
   */
  checkForOverlap(el1, el2) {
    let result = false;
    const bounds1 = el1.getBoundingClientRect();
    const bounds2 = el2.getBoundingClientRect();

    const firstIstLeftmost = (bounds1.left <= bounds2.left);
    const leftmost = firstIstLeftmost ? bounds1 : bounds2;
    const rightmost = firstIstLeftmost ? bounds2 : bounds1;

    // change to >= if border overlap should count
    if (leftmost.right > rightmost.left) {
      const firstIsTopmost = (bounds1.top <= bounds2.top);
      const topmost = firstIsTopmost ? bounds1 : bounds2;
      const bottommost = firstIsTopmost ? bounds2 : bounds1;

      // change to >= if border overlap should count
      result = topmost.bottom > bottommost.top;
    }

    return result;
  }


  /**
  * Selects the SampleItem currently under the mouse cursor
  *
  * @param {MouseEvent} e
  */
  selectItemUnderCursor(e, item) {
    this.sampleGridItemsSelectedHandler(e, [item]);
  }
  

  /**
   * Handles multiple item selection on mouseDown, initializes the 'rubberband'
   * that outlines the selected area.
   *
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    const selectionRubberBand = document.querySelector('#selectionRubberBand');
    selectionRubberBand.style.top = `${e.pageY}px`;
    selectionRubberBand.style.left = `${e.pageX}px`;
    selectionRubberBand.style.width = '0px';
    selectionRubberBand.style.height = '0px';
    this.showRubberBand = true;

    if(this.props.contextMenu.show) {
      this.props.showGenericContextMenu(false, null, 0, 0)
    }

    e.preventDefault();
    e.stopPropagation();
  }


  /**
   * Updates the rubberband if the mutiple selection was initiated (mouseDown
   * followed by mouseMove)
   *
   * @param {MouseEvent} e
   */
  onMouseMove(e) {
    if (this.showRubberBand) {
      const selectionRubberBand = document.querySelector('#selectionRubberBand');
      document.querySelector('#selectionRubberBand').style.display = 'block';
      selectionRubberBand.style.width = `${e.pageX - selectionRubberBand.offsetLeft}px`;
      selectionRubberBand.style.height = `${e.pageY - selectionRubberBand.offsetTop}px`;
    }

    e.preventDefault();
    e.stopPropagation();
  }


  /**
   * Selectes the items under the slected area and hides the rubberband
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    const selectionRubberBand = document.querySelector('#selectionRubberBand');

    const selected = this.sampleItems.filter((sampleItem) => {
      const sampleElement = document.getElementById(sampleItem.key);
      return this.checkForOverlap(selectionRubberBand, sampleElement);
    }).map((sampleItem) => sampleItem.key);

    selectionRubberBand.style.display = 'none';
    this.showRubberBand = false;

    // If several samples selected call the handler, otherwise rely on
    // onClick handler to handle the click
    if (selected.length > 0) {
      this.sampleGridItemsSelectedHandler(e, selected);
    }
  }


  /**
   * @param {MouseEvent} e
  */
  onKeyDown(e) {
    switch (e.key) {
    case 'Escape': {
      this.props.selectSamples(Object.keys(this.props.sampleList), false);
    break;
    }
    // No default
    }
  }

  /**
   * Filter function for SampleItems
   *
   * @property {Object} sampleList
   * @property {Object} filterOptions
   *
   * @param {string} key - sampleID
   *
   * return {boolean} true if item is to be excluded otherwise false
  */
  filter(key) {
    const sample = this.props.sampleList[key];
    let fi = false;

    if (sample) {
      const sampleFilter = `${sample.sampleName} ${sample.proteinAcronym}`.toLowerCase();
      const locationFilter = `${sample.location}`;

      fi = sampleFilter.includes(this.props.filterOptions.text.toLowerCase());

      // we can't filter if there is only one cell 
      if (Object.values(this.props.sampleList).every( cell => cell.cell_no != 1)) {
        fi &= locationFilter.startsWith(this.props.filterOptions.cellFilter.toLowerCase());
      }
      fi &= this.mutualExclusiveFilterOption(sample, 'inQueue', 'notInQueue', this.inQueueSampleID);
      fi &= this.mutualExclusiveFilterOption(sample, 'collected', 'notCollected', isCollected);
      fi &= this.mutualExclusiveFilterOption(sample, 'limsSamples', '', hasLimsData);
    }

    return fi;
  }  

  /**
  * Select Items in a cell for collect
  */
  pickAllCellItemsOnClick (e, cell, pickSample) {
    const sampleItem = []
    this.props.order.forEach(key => {
      const sample = this.props.sampleList[key];
      if (this.filter(key) && sample.cell_no == cell) {
          sampleItem.push(sample.sampleID)
        }
    });

    if(pickSample) {
      this.props.addSamplesToQueue(sampleItem)
    }
    else{
      this.props.inQueueDeleteElseAddSamples(sampleItem, false);
    }
    e.stopPropagation()
  }
    
  /**
   * Select Items in a puck for collect or select
  */
  pickAllPuckItemsOnClick(e, cell, pickSample, puck) {
    const sampleItem = []
    this.props.order.forEach(key => {
      const sample = this.props.sampleList[key];
      if (this.filter(key) && sample.cell_no == cell && sample.puck_no == puck ) {
          sampleItem.push(sample.sampleID)
        }
    });

    if(pickSample) {
      this.props.addSamplesToQueue(sampleItem)
    }
    else {
      this.props.inQueueDeleteElseAddSamples(sampleItem, false);
    }
    e.stopPropagation()
  }

  getSampleListBydCell(cell) {
    const allCellSample = [];
    const allCellSampleCheck = [];

    this.props.order.forEach(key => {
      const sample = this.props.sampleList[key];
        if (sample.cell_no == cell) {
          allCellSample.push(sample.sampleID);
          if (this.props.inQueue(sample.sampleID) && sample.checked) {
            allCellSampleCheck.push(sample.sampleID)
          }
        }
    });
    return [allCellSample, allCellSampleCheck, cell, null ]
  }

  
  getSampleListFilteredByCell(cell) {
    const allCellSample = [];
    const allCellSampleCheck = [];

    this.props.order.forEach(key => {
      const sample = this.props.sampleList[key];
      if (this.filter(key) && sample.cell_no == cell) {
          allCellSample.push(sample.sampleID);
          if (this.props.inQueue(sample.sampleID) && sample.checked) {
            allCellSampleCheck.push(sample.sampleID)
          }
        }
    });
    return [allCellSample, allCellSampleCheck, cell, null ]
  }

  getSampleListFilteredByPuck(cell, puck) {
    const allPuckSample = [];
    const allPuckSampleCheck = [];

    this.props.order.forEach(key => {
      const sample = this.props.sampleList[key];
      if (this.filter(key) && sample.cell_no == cell && sample.puck_no == puck ) {
          allPuckSample.push(sample.sampleID);
          if (this.props.inQueue(sample.sampleID) && sample.checked) {
            allPuckSampleCheck.push(sample.sampleID)
          }
        }
    });
    return [allPuckSample, allPuckSampleCheck, cell, puck]
  }
  

  displayContextMenu(e, contextMenuID, sampleID) {
    this.showRubberBand = false;
    if (this.props.queue.queueStatus !== QUEUE_RUNNING) {
      this.props.showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY)
    }
    this.selectItemUnderCursor(e, sampleID)
  }

  displayPuckCellContextMenu(e, contextMenuID, cell, puck) {
    let selectedList = []

    if (this.props.queue.queueStatus !== QUEUE_RUNNING) {
      this.props.showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY)
    }
    // select all sample in the Puck
    // if puck is null we select all sample in the cell
    if(puck !== null) {
      selectedList = this.getSampleListFilteredByPuck(cell, puck)[0]
    }
    else {
      selectedList = this.getSampleListFilteredByCell(cell)[0]
    }

    this.sampleGridItemsSelectedHandler(e, selectedList);
    e.stopPropagation()
  }


  itemsControls(filterList) {
    let icon = <BsSquare size='0.9em'/>;
    const allPuckSample = filterList[0];
    const allPuckSampleCheck = filterList[1];
    let pickSample = true;
    const cell = filterList[2]
    const puck = filterList[3]

    if (allPuckSample.length === allPuckSampleCheck.length) {
      icon = <BsCheck2Square size='0.9em'/>;
      pickSample = false;
    }
    else if(allPuckSample.length !== allPuckSampleCheck.length && allPuckSampleCheck.length > 0) {
      icon = <BsDashSquare size='0.9em'/>;
      pickSample = false;
    }

    let onClickFunc = this.pickAllPuckItemsOnClick;

    if (puck === null) {
      onClickFunc = this.pickAllCellItemsOnClick;
    }

    return (
      <OverlayTrigger
        placement="auto"
        overlay={(
        <Tooltip id="pick-sample">{pickSample? 'Pick samples/ Add to Queue' : 'Unpick samples / Remove from Queue'}</Tooltip>
        )}
      >
        <Button
          variant="content"
          disabled={this.props.current && this.props.picked}
          className="pick-puck-checkbox-button"
          onClick={(e) => onClickFunc(e, cell, pickSample, puck, )}
        >
          <i>{icon}</i>
        </Button>
      </OverlayTrigger>
    );
  }

  getSampleItemCollapsibleHeaderActions(name) {
    const cellMenuID = 'samples-grid-table-context-menu-cell'
    return(
      <div className='sample-items-collapsible-header-actions'>
        <b className='me-2 mt-1'>Cell {name}</b>
        {this.itemsControls(this.getSampleListFilteredByCell(name))}
        <span
          title='Cell Options'
          className='samples-grid-table-context-menu-icon'
          onClick={(e) => {this.displayPuckCellContextMenu(e, cellMenuID, name, null)}}
        >
          <BiMenu size='1.5em'/>
        </span>
      </div>
    )
  }

  getCollapsibleHeaderOpen(name, cssClass) {
    return (
      <div className='sample-items-collapsible-header'>
        {this.getSampleItemCollapsibleHeaderActions(name)}
        <BsChevronUp className={cssClass} size="1em"/>
      </div>
    )
  }

  getCollapsibleHeaderClose(name, cssClass) {
    return (
      <div className='sample-items-collapsible-header'>
        {this.getSampleItemCollapsibleHeaderActions(name)}
        <BsChevronDown className={cssClass} size="1em"/>
      </div>
    )
  }

  /**
   * Build a list of SampleItems and for each SampleItem a list of TaskItems
   *
   * @property {Object} sampleList
   * @property {array} order
   * @property {array} queue
   * @property {object} selected
   *
   * return {array} array of SampleItems
   */
  getSampleItems(props, cell, puck) {
    const sampleItemList = [];
    const orderedList = [];

    props.order.forEach(key => {
      if (props.queue.queue.includes(key) && props.sampleList[key].checked) {
        orderedList.push(key);
      }
    });

    props.order.forEach(key => {
      const sample = props.sampleList[key];
      const picked= props.inQueue(sample.sampleID) && sample.checked

      const classes = classNames('samples-grid-table-li',
      { 
        'samples-grid-table-item-selected': props.selected[sample.sampleID],
        'samples-grid-table-item-to-be-collected': picked,
        'samples-grid-table-item-collected': isCollected(sample) });

      const settings = {
        dots: false,
        infinite: false,
        speed: 100,
        slidesToShow: 6,
        slidesToScroll: 6
      };

      if (this.filter(key) && sample.cell_no == cell && sample.puck_no == puck ) {
          let contextMenuID = 'samples-grid-table-context-menu';
          if (this.currentSample(sample.sampleID)) {
            contextMenuID = 'samples-grid-table-context-menu-mounted';
          }
          // const contextMenuID = this.props.sampleChanger.loadedSample.address == sample.sampleID ?
          // 'samples-grid-table-context-menu-mounted' : 'samples-grid-table-context-menu';

          sampleItemList.push(
            <div
              className={classes}
              key={key}
              onContextMenu={(e) => {this.displayContextMenu(e, contextMenuID, sample.sampleID)}}
              onClick={(e) => {this.selectItemUnderCursor(e, sample.sampleID)}}
            >
              <SampleGridTableItem
                  key={key}
                  itemKey={key}
                  pickButtonOnClickHandler={this.sampleItemPickButtonOnClickHandler}
                  sampleData={sample}
                  queueOrder={orderedList.indexOf(key) + 1}
                  selected={props.selected[sample.sampleID]}
                  current={this.currentSample(sample.sampleID)}
                  picked={picked}
                >
                  <Slider
                    className="samples-grid-table-item-tasks"
                    {...settings}
                  >
                    {sample.tasks.map((taskData, i) => (
                      <TaskItem
                        key={i}
                        taskItemOnClick={this.taskItemOnClickHandler}
                        showDialog={this.props.showDialog}
                        deleteButtonOnClick={this.taskItemDeleteButtonOnClickHandler}
                        taskData={taskData}
                        taskIndex={i}
                      />))
                    }
                  </Slider>
                </SampleGridTableItem>
            </div>
            );
          }
    });

    return sampleItemList;
  }
  
  
  getSamplesList(props) {
    const sampleItemList = [];

    props.order.forEach(key => {
      const sample = props.sampleList[key];
      if (this.filter(key)) {
          sampleItemList.push(<li key={key}>{sample.sampleID}</li>);
        }
    });

    return sampleItemList;
  }


  getSampleTable(props) {
    const sc = props.sampleChanger.contents;
    const tableCell = [];

    // This is a bug
    let sampleItemList = [];

    if (sc.children && props.order.length > 0) {
      Object.values(sc.children).map((cell) => {
        if (this.props.filterOptions.cellFilter.toLowerCase() === cell.name
          || this.props.filterOptions.cellFilter.toLowerCase() === '') {

          // we check in among for each puck , if there are samples 
          // we won't display the cell / table  if all puck in the cell are empty 
          cell.children.forEach((puck)=> {
            const indxP = cell.children.indexOf(puck);
            sampleItemList.push(this.getSampleItems(props, cell.name, indxP + 1));
          });

          if (sampleItemList.find(sil => sil.length > 0)) {   
            tableCell.push(
              <div key={`cell-${cell.name}`} className="div-sample-items-collapsible">
                <Collapsible transitionTime={300}
                  className='sample-items-collapsible'
                  openedClassName="sample-items-collapsible"
                  open
                  trigger={this.getCollapsibleHeaderClose(cell.name, 'collapsible-arrow-c')}
                  triggerWhenOpen={this.getCollapsibleHeaderOpen(cell.name, 'collapsible-arrow-c')}
                >
                  <Table bordered responsive size="sm" className='sample-items-table'>
                    <thead>
                      <tr>
                        {cell.children.map((puck, idxth)=> {
                          if(this.getSampleItems(props, cell.name, idxth+1).length > 0) {
                            const puckMenuID = 'samples-grid-table-context-menu-puck'
                            return(
                              <th key={`th-${puck.name}`} className='sample-items-table-row-header-th'>
                                <span style={{ marginLeft: '5px', marginTop: '4px', float:'left'}}>
                                  Puck {idxth+1}
                                  {puck.id != '' ?
                                    <div className='sample-items-puck-code' title={puck.id}>
                                      Code : {puck.id}
                                    </div>
                                    :
                                    null
                                  }
                                </span>
                                <span style={{ marginTop: '15px', marginRight: '2px'}}>
                                  {this.itemsControls(this.getSampleListFilteredByPuck(cell.name, idxth+1))}
                                </span>
                                <span
                                  title='Puck Options'
                                  className='samples-grid-table-context-menu-icon'
                                  onClick={(e) => {this.displayPuckCellContextMenu(e, puckMenuID, cell.name, idxth+1)}}
                                >
                                  <BiMenu size='1.5em'/>
                                </span>
                              </th>
                            )
                          }
                          return null;
                      })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {cell.children.map((puck, idxtd)=> {
                          if(this.getSampleItems(props, cell.name, idxtd+1).length > 0) {
                            return(
                              <td key={`td-${puck.name}`} className={`sample-items-table-column-body custom-table-border-${idxtd+1}`}>
                                {this.getSampleItems(props, cell.name, idxtd+1)}
                              </td>
                            )
                          }
                          return null
                        })}
                      </tr>
                    </tbody>
                  </Table>
                </Collapsible>
              </div>
            );
          }
          // after each check we empty the filter List 
          sampleItemList = [];
        }
        else {return null}
        return null;
      });
    }
    return tableCell;
  }


  currentSample(sampleID) {
    let current = false;

    if (this.props.queue.current.sampleID) {
      current = this.props.queue.current.sampleID === sampleID;
    } else if (this.props.sampleChanger.loadedSample.address) {
      current = this.props.sampleChanger.loadedSample.address === sampleID;
    }

    return current;
  }


  /**
   * Helper function for filter that takes a sample object instead of sampleID
   *
   * @param {object} sample
   * return {boolean} true if sample is in queue otherwise false
   */
  inQueueSampleID(sample) {
    return this.props.inQueue(sample.sampleID);
  }


  /**
   * Performs filtering on a sample with two options that are mutually exclusive
   * Includes sample according to provided options o1 and o2, always includes the
   * sample if both options are either true or false simultaneously (ignoring the
   * options o1 and o2)
   *
   * @property {Object} filterOptions
   * @param {Object} sample
   * @param {string} o1 - option name 1
   * @param {string} o2 - option name 2
   * @param {function} fun - function that tests for inclusion
   *
   * return {boolean} true if item is to be included otherwise false
   */
  mutualExclusiveFilterOption(sample, o1, o2, testFun) {
    let includeItem = false;

    // First case is included for clarity since the two options
    // cancel each other out. Dont do anything same as both false. Otherwise
    // apply filter.

    if (this.props.filterOptions[o1] && this.props.filterOptions[o2]) {
      includeItem = true;
    } else if (!this.props.filterOptions[o1] && !this.props.filterOptions[o2]) {
      includeItem = true;
    } else if (this.props.filterOptions[o1]) {
      includeItem = testFun(sample);
    } else if (this.props.filterOptions[o2]) {
      includeItem = !testFun(sample);
    }

    return includeItem;
  }



  /**
   * Handles click on sample item pick 'checkbox', adds sample to queue if its
   * not in the queue or removes it from the queue if it was already in.
   *
   * @param {MouseEvent} e
   * @param {string} sampleID - sampleID to toggle (remove from or add to queue)
   */
  sampleItemPickButtonOnClickHandler(e, sampleID) {
    e.stopPropagation();

    // If sample already in the set of selected samples, add all those samples
    // to queue
    if (this.sampleItemIsSelected(sampleID)) {
      this.props.inQueueDeleteElseAddSamples(Object.keys(this.props.selected), true);
    } else {
      // The sample is not in the set of selected samples (or no samples are
      // selected), select only sample with sampleID and add it queue
      this.props.selectSamples([sampleID]);
      this.props.inQueueDeleteElseAddSamples([sampleID], true);
    }
  }


  /**
   * Returns true if sample is selected
   *
   * @param {string} sampleID
   * @return {boolean} true if sample is selected else false
   */
  sampleItemIsSelected(sampleID) {
    return Object.keys(this.props.selected).includes(sampleID);
  }



  /**
   * Handels clicks on TaskItem
   *
   * @param {MouseEvent} e
   * @param {object} task - clicked task
   */
  taskItemOnClickHandler(e, task) {
    e.stopPropagation();
    this.props.showTaskParametersForm(task.type, task.sampleID, task);
  }


  /**
   * Handels clicks on TaskItem delete button
   *
   * @param {MouseEvent} e
   * @param {string} sampleID - sampleID of the sample the tasks belong to
   * @param {number} taskIndex - index of task
   */
  taskItemDeleteButtonOnClickHandler(e, sampleID, taskIndex) {
    e.stopPropagation();

    if (this.props.queue.queueStatus === QUEUE_STOPPED) {
      this.props.deleteTask(sampleID, taskIndex);
    }
  }





  /**
   * Returns menu options for workflow tasks
   *
   * @property {Object} workflows
   *
   * return {array} Array of <Dropdown.Item>
   */
  workflowMenuOptions() {
    const workflowTasks = { point: [], line: [], grid: [], samplegrid: [], none: [] };

    Object.values(this.props.workflows).forEach((wf) => {
      if (wf.requires.includes('point')) {
        workflowTasks.point.push({ text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}` });
      } else if (wf.requires.includes('line')) {
        workflowTasks.line.push({ text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}` });
      } else if (wf.requires.includes('grid')) {
        workflowTasks.grid.push({ text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}` });
      } else if (wf.requires.includes('samplegrid')) {
        workflowTasks.samplegrid.push({ text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}` });
      } else {
        workflowTasks.none.push({ text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}` });
      }
    });

    return workflowTasks.samplegrid.map((wf) => (
      <Dropdown.Item onClick={wf.action} key={wf.key}>
        {wf.text}
      </Dropdown.Item>
    ));
  }


  mountAndCollect() {
    let sampleData = null;

    // If several samples selected mount the first one and add the others to the queue
    this.props.order.some((sampleID) => {
      if (this.props.selected[sampleID]) {
        sampleData = this.props.sampleList[sampleID];
      }
      return this.props.selected[sampleID] === true;
    });

    if (sampleData) {
      this.props.addSampleAndMount(sampleData);
      this.props.router.navigate('/datacollection' , { replace: true });
    }
  }


  unmount() {
    this.props.unloadSample();
  }

  taskContextMenuItems() {
    return (
      <>
        <Dropdown.Divider/>
        <Dropdown.Header><i className="fas fa-plus" /> Add </Dropdown.Header>
        <Dropdown.Item onClick={this.props.showDataCollectionForm}>
          Data collection
        </Dropdown.Item>
        <Dropdown.Item onClick={this.props.showCharacterisationForm}>
          Characterisation
        </Dropdown.Item>
        {this.workflowMenuOptions()}
        <Dropdown.Divider />
        <Dropdown.Header><MdRemove glyph="minus" /> Remove</Dropdown.Header>
        <Dropdown.Item onClick={this.props.removeSelectedSamples}>
          Dequeue Samples
        </Dropdown.Item>
        <Dropdown.Item onClick={this.props.removeSelectedTasks}>
          Remove Tasks
        </Dropdown.Item>
      </>
    );
  }


  sampleContextMenu() {
    return (
      <>
        <Dropdown.Item onClick={this.props.addSelectedSamplesToQueue}>
          <span><i className="fas fa-plus" />Add to Queue</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={this.mountAndCollect}>
          <span><MdFlare glyph="screenshot" /> Mount </span>
        </Dropdown.Item>
      </>
    );
  }

  sampleContextMenuMounted() {
    return (
      <>
      <Dropdown.Item onClick={this.props.addSelectedSamplesToQueue}>
        <span><i className="fas fa-plus" /> Add to Queue</span>
      </Dropdown.Item>
      <Dropdown.Item onClick={this.unmount}>
        <span><Md360 glyph="share-alt" /> Unmount </span>
      </Dropdown.Item>
      </>
    );
  }

  renderContextMenu (id) {
    let menu = <Dropdown.Item href="#/action-1">....</Dropdown.Item>;
    if(id == 'samples-grid-table-context-menu') {
      menu = (
        <>
        {this.sampleContextMenu()}
        {this.taskContextMenuItems()}
        </>
      )
    }
    else if(id == 'samples-grid-table-context-menu-mounted') {
      menu = (
        <>
          {this.sampleContextMenuMounted()}
          {this.taskContextMenuItems()}
        </>
      )
    }
    else if(id == 'samples-grid-table-context-menu-cell') {
      menu = (
        <>
          <Dropdown.Header>Cell Actions</Dropdown.Header>
          {this.taskContextMenuItems()}
        </>
      )
    }
    else if(id == 'samples-grid-table-context-menu-puck') {
      menu = (
        <>
          <Dropdown.Header>Puck Actions</Dropdown.Header>
          {this.taskContextMenuItems()}
        </>
      )
    }

    return menu;
  }

  render() {
    this.sampleItems = this.getSamplesList(this.props);
    const nb_puck = this.props.sampleChanger.contents.children[0].children.length
    return (
      <div>
        {this.props.contextMenu.show ?
          (
            <MXContextMenu
              id={this.props.contextMenu.id}
              show={this.props.contextMenu.show}
              x={this.props.contextMenu.x}
              y={this.props.contextMenu.y}

            >
              {this.renderContextMenu(this.props.contextMenu.id)}
            </MXContextMenu>
          )
          :
          null
        }
        {this.props.viewMode.mode == 'Graphical View'?
          (
          <Row
            className="samples-grid-table"
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            onMouseMove={this.onMouseMove}
            xs="auto"
          >
            <div className="selection-rubber-band" id="selectionRubberBand" />
            <SampleFlexView
              cellSampleList={this.getSampleListBydCell}
            />            
            <Col sm={7}>
              {this.getSampleTable(this.props)}
            </Col>

          </Row>
          )
          :
          (
            <Row
              className="samples-grid-table"
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onMouseUp}
              onMouseMove={this.onMouseMove}
              xs="auto"
            >
              <div className="selection-rubber-band" id="selectionRubberBand" />
              {/* if nb of puck is <= to 3 we order Cell Table by  pair on right Col and odd on Left */}
              {nb_puck <= 3 ?
                <>
                  <Col sm>
                  {this.getSampleTable(this.props).filter((n, i) => i % 2 != 1)}
                  </Col>
                  <Col sm>
                      {this.getSampleTable(this.props).filter((n, i) => i % 2 == 1)}
                  </Col>
                </>
                :
                <Col sm>
                  {this.getSampleTable(this.props)}
                </Col>
              }
            </Row>
          )
        }
      </div>
    );
  }
}

/**
 * @property {Object} sampleList - list of samples
 * @property {array} order - order of samples within sample list
 * @property {array} queue - samples in queue
 * @property {object} selected - contains samples that are currently selected
 *
 */
function mapStateToProps(state) {
  return {
    workflows: state.workflow.workflows,
    queue: state.queue,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    filterOptions: state.sampleGrid.filterOptions,
    order: state.sampleGrid.order,
    viewMode: state.sampleGrid.viewMode,
    contextMenu: state.contextMenu.genericContextMenu,
    sampleChanger: state.sampleChanger
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendSetSampleOrderAction: (order) => dispatch(sendSetSampleOrderAction(order)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    unloadSample: bindActionCreators(unloadSample, dispatch),
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    showGenericContextMenu: (show, id, x, y) => dispatch(showGenericContextMenu(show, id, x, y)),
    selectSamples: (keys, selected) => dispatch(selectSamplesAction(keys, selected)),
    addSampleAndMount: bindActionCreators(addSampleAndMount, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch)
  };
}

SampleGridTableContainer = withRouter(SampleGridTableContainer);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridTableContainer);