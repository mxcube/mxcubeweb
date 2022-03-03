import React from 'react';
import { withRouter } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Glyphicon, MenuItem } from 'react-bootstrap';

import { SpringGrid } from 'react-stonecutter';

import {
  QUEUE_STOPPED,
  QUEUE_RUNNING,
  isCollected,
  hasLimsData,
} from '../constants';

import {
  toggleMovableAction,
  selectSamplesAction,
  sendSetSampleOrderAction,
} from '../actions/sampleGrid';

import { deleteTask, addSampleAndMount } from '../actions/queue';

import { unloadSample } from '../actions/sampleChanger';

import { showTaskForm } from '../actions/taskForm';

import { showDialog } from '../actions/general';

import {
  SampleGridItem,
  SAMPLE_ITEM_WIDTH,
  SAMPLE_ITEM_HEIGHT,
  SAMPLE_ITEM_SPACE,
} from '../components/SampleGrid/SampleGridItem';

import { TaskItem } from '../components/SampleGrid/TaskItem';

import '../components/SampleGrid/SampleGrid.css';

class SampleGridContainer extends React.Component {
  constructor(props) {
    super(props);
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.filter = this.filter.bind(this);
    this.mutualExclusiveFilterOption =
      this.mutualExclusiveFilterOption.bind(this);
    this.sampleGridItemsSelectedHandler =
      this.sampleGridItemsSelectedHandler.bind(this);
    this.inQueueSampleID = this.inQueueSampleID.bind(this);

    this.currentSample = this.currentSample.bind(this);
    this.getSampleItems = this.getSampleItems.bind(this);
    this.selectItemUnderCursor = this.selectItemUnderCursor.bind(this);
    this.sampleItemPickButtonOnClickHandler =
      this.sampleItemPickButtonOnClickHandler.bind(this);
    this.sampleItemMoveButtonOnClickHandler =
      this.sampleItemMoveButtonOnClickHandler.bind(this);
    this.sampleItemOnMoveHandler = this.sampleItemOnMoveHandler.bind(this);
    this.sampleItemIsSelected = this.sampleItemIsSelected.bind(this);
    this.sampleItemCanMove = this.sampleItemCanMove.bind(this);

    this.taskItemDeleteButtonOnClickHandler =
      this.taskItemDeleteButtonOnClickHandler.bind(this);
    this.taskItemOnClickHandler = this.taskItemOnClickHandler.bind(this);

    this.showRubberBand = false;
    this.sampleItems = [];
    this.workflowMenuOptions = this.workflowMenuOptions.bind(this);
    this.mountAndCollect = this.mountAndCollect.bind(this);
    this.unmount = this.unmount.bind(this);

    this.currentCtxMenu = 'contextMenu';
  }

  componentDidMount() {
    document.addEventListener('contextmenu', this.onContextMenu, false);
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('click', this.onClick, false);
  }

  shouldComponentUpdate(nextProps) {
    return (
      this.props.queue.queue !== nextProps.queue.queue ||
      Object.keys(this.props.sampleList) !==
        Object.keys(nextProps.sampleList) ||
      this.props.order !== nextProps.order
    );
  }

  componentWillUnmount() {
    document.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('click', this.onClick);
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
      const selectionRubberBand = document.querySelector(
        '#selectionRubberBand'
      );
      document.querySelector('#selectionRubberBand').style.display = 'block';
      selectionRubberBand.style.width = `${
        e.pageX - selectionRubberBand.offsetLeft
      }px`;
      selectionRubberBand.style.height = `${
        e.pageY - selectionRubberBand.offsetTop
      }px`;
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

    const selected = this.sampleItems
      .filter((sampleItem) => {
        const sampleElement = document.getElementById(sampleItem.key);
        return this.checkForOverlap(selectionRubberBand, sampleElement);
      })
      .map((sampleItem) => sampleItem.key);

    selectionRubberBand.style.display = 'none';
    this.showRubberBand = false;

    // If several samples selected call the handler, otherwise rely on
    // onClick handler to handle the click
    if (selected.length > 1) {
      this.sampleGridItemsSelectedHandler(e, selected);
    } else {
      const contextMenu = document.getElementById(this.currentCtxMenu);

      // If context menu is displayed hide it otherwise select item under cursor
      if (e.button !== 2 && contextMenu.style.display !== 'none') {
        contextMenu.style.display = 'none';
      } else {
        this.selectItemUnderCursor(e);
      }
    }
  }

  /**
   * Moves SampleItems on arrow key press
   *
   * @param {MouseEvent} e
   */
  onKeyDown(e) {
    const sampleID = Object.keys(this.props.moving)[0];

    switch (e.key) {
    case 'ArrowRight': {
      this.sampleItemOnMoveHandler(e, sampleID, 'RIGHT');
    
    break;
    }
    case 'ArrowLeft': {
      this.sampleItemOnMoveHandler(e, sampleID, 'LEFT');
    
    break;
    }
    case 'ArrowDown': {
      this.sampleItemOnMoveHandler(e, sampleID, 'DOWN');
    
    break;
    }
    case 'ArrowUp': {
      this.sampleItemOnMoveHandler(e, sampleID, 'UP');
    
    break;
    }
    // No default
    }
  }

  /**
   * Selects clicked item and shows context menu
   *
   * @param {MouseEvent} e
   */
  onContextMenu(e) {
    let res = true;

    this.selectItemUnderCursor(e);
    this.currentCtxMenu = 'contextMenu';
    let contextMenuToHide = 'contextMenuMounted';

    if (
      Object.keys(this.props.selected)[0] ===
      this.props.sampleChanger.loadedSample.address
    ) {
      this.currentCtxMenu = 'contextMenuMounted';
      contextMenuToHide = 'contextMenu';
    }

    const menuEl = document.getElementById(this.currentCtxMenu);

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      menuEl.style.display = 'none';
    } else if (
      e.target.className.includes('samples-grid-item') &&
      e.button === 2
    ) {
      menuEl.style.top = `${e.pageY}px`;
      menuEl.style.left = `${e.pageX}px`;
      menuEl.style.display = 'block';
      document.getElementById(contextMenuToHide).style.display = 'none';
      res = false;
    } else {
      menuEl.style.display = 'none';
    }

    return res;
  }

  /**
   * Build a list of SampleItems and for each SampleItem a list of TaskItems
   *
   * @property {Object} sampleList
   * @property {array} order
   * @property {array} queue
   * @property {object} moving
   * @property {object} selected
   *
   * return {array} array of SampleItems
   */
  getSampleItems(props) {
    const sampleItemList = [];
    const orderedList = [];

    props.order.forEach((key) => {
      if (props.queue.queue.includes(key) && props.sampleList[key].checked) {
        orderedList.push(key);
      }
    });

    props.order.forEach((key) => {
      const sample = props.sampleList[key];
      const liClass = props.moving[key]
        ? 'samples-grid-li-mv'
        : 'samples-grid-li';

      if (this.filter(key)) {
        sampleItemList.push(
          <li className={liClass} key={key}>
            <SampleGridItem
              key={key}
              itemKey={key}
              pickButtonOnClickHandler={this.sampleItemPickButtonOnClickHandler}
              moveButtonOnClickHandler={this.sampleItemMoveButtonOnClickHandler}
              onMoveHandler={this.sampleItemOnMoveHandler}
              allowedDirections={this.sampleItemCanMove(key)}
              sampleData={sample}
              queueOrder={orderedList.indexOf(key) + 1}
              selected={props.selected[sample.sampleID]}
              current={this.currentSample(sample.sampleID)}
              picked={props.inQueue(sample.sampleID) && sample.checked}
              moving={props.moving[key]}
            >
              {sample.tasks.map((taskData, i) => (
                <TaskItem
                  key={i}
                  taskItemOnClick={this.taskItemOnClickHandler}
                  showDialog={this.props.showDialog}
                  deleteButtonOnClick={this.taskItemDeleteButtonOnClickHandler}
                  taskData={taskData}
                  taskIndex={i}
                />
              ))}
            </SampleGridItem>
          </li>
        );
      }
    });

    return sampleItemList;
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
   * Selects the SampleItem currently under the mouse cursor
   *
   * @param {MouseEvent} e
   */
  selectItemUnderCursor(e) {
    // Handling single item selection, create a syntheticElement to use for the
    // mouse cursor when doing the overlap detection, reusing the same
    // mechanism as for mutiple selection
    const syntheticElement = {
      getBoundingClientRect: () => {
        return {
          top: e.clientY,
          left: e.clientX,
          bottom: e.clientY + 1,
          right: e.clientX + 1,
          width: 1,
          height: 1,
        };
      },
    };

    const selected = this.sampleItems
      .filter((sampleItem) => {
        const sampleElement = document.getElementById(sampleItem.key);
        return this.checkForOverlap(syntheticElement, sampleElement);
      })
      .map((sampleItem) => sampleItem.key);

    if (selected.length > 0) {
      this.sampleGridItemsSelectedHandler(e, selected);
    }
  }

  /**
   * Calculates the grid dimension
   *
   * return {array} array on the format [NumRowsCol1, NumRowsCol2, ... NumRowsColN]
   */
  gridDimension() {
    const colArray = [];
    const numItems = Object.keys(this.props.order).length;
    const numFullCols = Math.floor(this.props.gridWidth[0] / SAMPLE_ITEM_WIDTH);
    const numFullRows = Math.floor(numItems / numFullCols);
    const itemsOnLastRow = numItems - numFullRows * numFullCols;

    for (let i = 0; i < numFullRows; i++) {
      colArray[i] = numFullCols;
    }

    if (itemsOnLastRow > 0) {
      colArray[numFullRows] = itemsOnLastRow;
    }

    return colArray;
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
      const sampleFilter =
        `${sample.sampleName} ${sample.proteinAcronym}`.toLowerCase();
      const locationFilter = `${sample.location}`;

      fi = sampleFilter.includes(this.props.filterOptions.text.toLowerCase());

      fi &= locationFilter.startsWith(
        this.props.filterOptions.puckFilter.toLowerCase()
      );
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'inQueue',
        'notInQueue',
        this.inQueueSampleID
      );
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'collected',
        'notCollected',
        isCollected
      );
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'limsSamples',
        '',
        hasLimsData
      );
    }

    return fi;
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
    const alreadySelected =
      sampleIDList.length === 1 && this.sampleItemIsSelected(sampleIDList[0]);
    let samplesToSelect = sampleIDList;

    // We dont want to do anything here if sample is already selected and
    // the right button was clicked. This allows for the context menu to be
    // used on several samples at once. Otherwise just do the select magic.
    if (!(alreadySelected && e.button === 2)) {
      // CTRL key is pressed just modify the current selection, remove already
      // selected and add new ones.
      if (e.ctrlKey) {
        const intersection = new Set(sampleIDList.filter((sampleID) =>
          this.sampleItemIsSelected(sampleID)
        ));

        const union = Object.keys(this.props.selected).concat(sampleIDList);
        samplesToSelect = union.filter(
          (sampleID) => !intersection.has(sampleID)
        );
      }

      this.props.selectSamples(samplesToSelect);
    }
  }

  /**
   * Handles sample movement in grid (change of order)
   *
   * @property {Object} order
   *
   * @param {MouseEvent} e
   * @param {array} sampleID - sample to move
   * @param {string} dir - direction to move one of [RIGHT, LEFT, DOWN, UP]
   *
   * return {boolean} true if item is to be included otherwise false
   */
  sampleItemOnMoveHandler(e, sampleID, dir) {
    e.preventDefault();
    e.stopPropagation();

    if (!sampleID || !this.props.moving[sampleID]) {
      return;
    }

    const numCols = this.gridDimension()[0];
    const sourcePos = this.props.order.indexOf(sampleID);
    let targetPos = sourcePos;
    const [canMoveUp, canMoveDown, canMoveLeft, canMoveRight] =
      this.sampleItemCanMove(sampleID);

    if (dir === 'RIGHT' && canMoveRight) {
      targetPos += 1;
    } else if (dir === 'LEFT' && canMoveLeft) {
      targetPos -= 1;
    } else if (dir === 'DOWN' && canMoveDown) {
      targetPos += numCols;
    } else if (dir === 'UP' && canMoveUp) {
      targetPos -= numCols;
    } else {
      return;
    }

    const newSampleOrder = [...this.props.order];
    newSampleOrder.splice(targetPos, 0, newSampleOrder.splice(sourcePos, 1)[0]);
    this.props.sendSetSampleOrderAction(newSampleOrder);
  }

  /**
   * Handles click on move sample button (when the user initiates move)
   *
   * @param {MouseEvent} e
   * @param {string} sampleID - sample to move
   */
  sampleItemMoveButtonOnClickHandler(e, sampleID) {
    e.stopPropagation();
    this.props.toggleMovableAction(sampleID);
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

    // Is sample already in the set of selected samples, add all those samples
    // to queue
    if (this.sampleItemIsSelected(sampleID)) {
      this.props.inQueueDeleteElseAddSamples(Object.keys(this.props.selected));
    } else {
      // The sample is not in the set of selected samples (or no samples are
      // selected), select only sample with sampleID and add it queue
      this.props.selectSamples([sampleID]);
      this.props.inQueueDeleteElseAddSamples([sampleID]);
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
   * Returns an array with booleans that tell if the SampleItem with
   * the given sampleID can move in a certain direction
   *
   * @param {key} sampleID
   * @return {array} - [canMoveUp, canMoveDown, canMoveLeft, canMoveRight]
   */
  sampleItemCanMove(key) {
    let [up, down, left, right] = [true, true, true, true];
    const itemPos = this.itemGridPosition(key);

    if (
      Object.keys(this.props.selected).map((_key) => this.props.selected[_key])
        .length === 1
    ) {
      if (itemPos.col === 0) {
        left = false;
      }

      if (itemPos.row === 0) {
        up = false;
      }

      if (itemPos.row === itemPos.gridDimension.length - 1) {
        down = false;
      }

      if (itemPos.col > itemPos.gridDimension[itemPos.row + 1] - 1) {
        down = false;
      }

      if (itemPos.col === itemPos.gridDimension[itemPos.row] - 1) {
        right = false;
      }
    } else {
      [up, down, left, right] = [false, false, false, false];
    }

    return [up, down, left, right];
  }

  /**
   * Returns the grid position of SampleItem
   *
   * @param {string} key - sampleID of the sample
   * @return {object} {row: n, col: m, gridDimension: [NumRowsCol1, ... NumRowsColN]}
   */
  itemGridPosition(key) {
    const gridDim = this.gridDimension();
    const numCols = gridDim[0];
    const pos = this.props.order.indexOf(key);

    const rowPos = Math.floor(pos / numCols);
    const colPos = pos - rowPos * numCols;

    return { row: rowPos, col: colPos, gridDimension: gridDim };
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

    const firstIstLeftmost = bounds1.left <= bounds2.left;
    const leftmost = firstIstLeftmost ? bounds1 : bounds2;
    const rightmost = firstIstLeftmost ? bounds2 : bounds1;

    // change to >= if border overlap should count
    if (leftmost.right > rightmost.left) {
      const firstIsTopmost = bounds1.top <= bounds2.top;
      const topmost = firstIsTopmost ? bounds1 : bounds2;
      const bottommost = firstIsTopmost ? bounds2 : bounds1;

      // change to >= if border overlap should count
      result = topmost.bottom > bottommost.top;
    }

    return result;
  }

  /**
   * Returns menu options for workflow tasks
   *
   * @property {Object} workflows
   *
   * return {array} Array of <MenuItem>
   */
  workflowMenuOptions() {
    const workflowTasks = {
      point: [],
      line: [],
      grid: [],
      samplegrid: [],
      none: [],
    };

    Object.values(this.props.workflows).forEach((wf) => {
      if (wf.requires.includes('point')) {
        workflowTasks.point.push({
          text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}`,
        });
      } else if (wf.requires.includes('line')) {
        workflowTasks.line.push({
          text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}`,
        });
      } else if (wf.requires.includes('grid')) {
        workflowTasks.grid.push({
          text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}`,
        });
      } else if (wf.requires.includes('samplegrid')) {
        workflowTasks.samplegrid.push({
          text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}`,
        });
      } else {
        workflowTasks.none.push({
          text: wf.wfname,
          action: () => this.props.showWorkflowForm(wf),
          key: `wf-${wf.wfname}`,
        });
      }
    });

    return workflowTasks.samplegrid.map((wf) => (
      <MenuItem eventKey={wf.key} onClick={wf.action} key={wf.key}>
        {wf.text}
      </MenuItem>
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
      this.props.router.push('datacollection');
    }
  }

  unmount() {
    this.props.unloadSample();
  }

  taskContextMenuItems() {
    return [
      <MenuItem divider />,
      <MenuItem header>
        {' '}
        <span>
          <Glyphicon glyph="plus" /> Add{' '}
        </span>
      </MenuItem>,
      <MenuItem eventKey="2" onClick={this.props.showDataCollectionForm}>
        Data collection
      </MenuItem>,
      <MenuItem eventKey="3" onClick={this.props.showCharacterisationForm}>
        Characterisation
      </MenuItem>,
      ...this.workflowMenuOptions(),
      <MenuItem divider />,
      <MenuItem header>
        <span>
          <Glyphicon glyph="minus" /> Remove{' '}
        </span>
      </MenuItem>,
      <MenuItem eventKey="1" onClick={this.props.removeSelectedSamples}>
        Dequeue Samples
      </MenuItem>,
      <MenuItem eventKey="1" onClick={this.props.removeSelectedTasks}>
        Remove Tasks
      </MenuItem>,
    ];
  }

  sampleContextMenu() {
    return [
      <MenuItem eventKey="1" onClick={this.props.addSelectedSamplesToQueue}>
        <span>
          <Glyphicon glyph="unchecked" /> Add to Queue
        </span>
      </MenuItem>,
      <MenuItem eventKey="2" onClick={this.mountAndCollect}>
        <span>
          <Glyphicon glyph="screenshot" /> Mount{' '}
        </span>
      </MenuItem>,
    ];
  }

  sampleContextMenuMounted() {
    return [
      <MenuItem eventKey="1" onClick={this.props.addSelectedSamplesToQueue}>
        <span>
          <Glyphicon glyph="unchecked" /> Add to Queue
        </span>
      </MenuItem>,
      <MenuItem eventKey="2" onClick={this.unmount}>
        <span>
          <Glyphicon glyph="share-alt" /> Unmount{' '}
        </span>
      </MenuItem>,
    ];
  }

  render() {
    this.sampleItems = this.getSampleItems(this.props);

    return (
      <div
        className="samples-grid"
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
      >
        <ul
          id="contextMenu"
          style={{ display: 'none' }}
          className="dropdown-menu"
          role="menu"
        >
          {this.sampleContextMenu()}
          {this.taskContextMenuItems()}
        </ul>
        <ul
          id="contextMenuMounted"
          style={{ display: 'none' }}
          className="dropdown-menu"
          role="menu"
        >
          {this.sampleContextMenuMounted()}
          {this.taskContextMenuItems()}
        </ul>

        <div className="selection-rubber-band" id="selectionRubberBand" />
        <SpringGrid
          component="ul"
          columns={this.props.gridWidth[1]}
          columnWidth={SAMPLE_ITEM_WIDTH}
          gutterWidth={SAMPLE_ITEM_SPACE}
          gutterHeight={SAMPLE_ITEM_SPACE + 3}
          itemHeight={SAMPLE_ITEM_HEIGHT}
        >
          {this.sampleItems}
        </SpringGrid>
      </div>
    );
  }
}

/**
 * @property {Object} sampleList - list of samples
 * @property {array} order - order of samples within sample list
 * @property {array} queue - samples in queue
 * @property {object} moving - contains samples that are currently beeing moved
 * @property {object} selected - contains samples that are currently selected
 *
 */
function mapStateToProps(state) {
  return {
    workflows: state.workflow.workflows,
    queue: state.queue,
    selected: state.sampleGrid.selected,
    moving: state.sampleGrid.moving,
    sampleList: state.sampleGrid.sampleList,
    filterOptions: state.sampleGrid.filterOptions,
    order: state.sampleGrid.order,
    sampleChanger: state.sampleChanger,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    sendSetSampleOrderAction: (order) =>
      dispatch(sendSetSampleOrderAction(order)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    unloadSample: bindActionCreators(unloadSample, dispatch),
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    selectSamples: (keys, selected) =>
      dispatch(selectSamplesAction(keys, selected)),
    addSampleAndMount: bindActionCreators(addSampleAndMount, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
  };
}

SampleGridContainer = withRouter(SampleGridContainer);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer);
