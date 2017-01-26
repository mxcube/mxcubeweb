import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Glyphicon, MenuItem } from 'react-bootstrap';

import {
  CSSGrid,
  enterExitStyle,
  easings,
  layout,
  measureItems,
  makeResponsive
} from 'react-stonecutter';

import { QUEUE_STOPPED, QUEUE_RUNNING } from '../constants';

import { toggleMovableAction,
         selectSamplesAction,
         setSampleOrderAction } from '../actions/sampleGrid';

import { deleteTask } from '../actions/queue';

import { showTaskForm } from '../actions/taskForm';

import { SampleGridItem,
         SAMPLE_ITEM_WIDTH,
         SAMPLE_ITEM_HEIGHT,
         SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';

import { TaskItem } from '../components/SampleGrid/TaskItem';

import '../components/SampleGrid/SampleGrid.css';


export default class SampleGrid extends React.Component {

  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClickHandler = this.onClickHandler.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.filter = this.filter.bind(this);
    this.sampleGridItemsSelectedHandler = this.sampleGridItemsSelectedHandler.bind(this);

    this.getSampleItems = this.getSampleItems.bind(this);
    this.selectItemUnderCusor = this.selectItemUnderCusor.bind(this);
    this.sampleItemPickButtonOnClickHandler = this.sampleItemPickButtonOnClickHandler.bind(this);
    this.sampleItemMoveButtonOnClickHandler = this.sampleItemMoveButtonOnClickHandler.bind(this);
    this.sampleItemOnMoveHandler = this.sampleItemOnMoveHandler.bind(this);
    this.sampleItemIsSelected = this.sampleItemIsSelected.bind(this);
    this.sampleItemCanMove = this.sampleItemCanMove.bind(this);

    this.taskItemDeleteButtonOnClickHandler = this.taskItemDeleteButtonOnClickHandler.bind(this);
    this.taskItemOnClickHandler = this.taskItemOnClickHandler.bind(this);

    this.showRubberBand = false;
    this.sampleItems = [];
  }


  componentDidMount() {
    document.addEventListener('contextmenu', this.onContextMenu, false);
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('click', this.onClick, false);
  }


  componentWillUnmount() {
    document.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('click', this.onClick);
  }


  /**
   * Handles single item selection and hides context menu if its displayed
   *
   * @param {MouseEvent} e
   */
  onClickHandler(e) {
    const contextMenu = document.getElementById('contextMenu');

    // If context menu is displayed hide it otherwise select item under cursor
    if (e.button !== 2 && contextMenu.style.display !== 'none') {
      contextMenu.style.display = 'none';
    } else {
      this.selectItemUnderCusor(e);
    }
  }


  /**
   * Handles multiple item selection on mouseDown, initializes the 'rubberband'
   * that outlines the selected area.
   *
   * @param {MouseEvent} e
   */
  onMouseDown(e) {
    const selectionRubberBand = document.getElementById('selectionRubberBand');
    selectionRubberBand.style.top = `${e.clientY}px`;
    selectionRubberBand.style.left = `${e.clientX}px`;
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
      const selectionRubberBand = document.getElementById('selectionRubberBand');
      document.getElementById('selectionRubberBand').style.display = 'block';
      selectionRubberBand.style.width = `${e.clientX - selectionRubberBand.offsetLeft}px`;
      selectionRubberBand.style.height = `${e.clientY - selectionRubberBand.offsetTop}px`;
    }

    e.preventDefault();
    e.stopPropagation();
  }


  /**
   * Selectes the items under the slected area and hides the rubberband
   * @param {MouseEvent} e
   */
  onMouseUp(e) {
    const selectionRubberBand = document.getElementById('selectionRubberBand');

    const selected = this.sampleItems.filter((sampleItem) => {
      const sampleElement = document.getElementById(sampleItem.key);
      return this.checkForOverlap(selectionRubberBand, sampleElement);
    }).map((sampleItem) => sampleItem.key);

    selectionRubberBand.style.display = 'none';
    this.showRubberBand = false;

    // If several samples selected call the handler, otherwise rely on
    // onClick handler to handle the click
    if (selected.length > 1) { this.sampleGridItemsSelectedHandler(e, selected); }
  }


  /**
   * Moves SampleItems on arrow key press
   *
   * @param {MouseEvent} e
   */
  onKeyDown(e) {
    const sampleID = Object.keys(this.props.moving)[0];

    if (e.key === 'ArrowRight') {
      this.sampleItemOnMoveHandler(e, sampleID, 'RIGHT');
    } else if (e.key === 'ArrowLeft') {
      this.sampleItemOnMoveHandler(e, sampleID, 'LEFT');
    } else if (e.key === 'ArrowDown') {
      this.sampleItemOnMoveHandler(e, sampleID, 'DOWN');
    } else if (e.key === 'ArrowUp') {
      this.sampleItemOnMoveHandler(e, sampleID, 'UP');
    }
  }

  /**
  * Selects clicked item and shows context menu
  *
  * @param {MouseEvent} e
  */
  onContextMenu(e) {
    let res = true;

    this.selectItemUnderCusor(e);

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      document.getElementById('contextMenu').style.display = 'none';
    } else if (e.target.className.indexOf('samples-grid-item') > -1 && e.button === 2) {
      document.getElementById('contextMenu').style.top = `${e.clientY - 52}px`;
      document.getElementById('contextMenu').style.left = `${e.clientX - 65}px`;
      document.getElementById('contextMenu').style.display = 'block';
      res = false;
    } else {
      document.getElementById('contextMenu').style.display = 'none';
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
  getSampleItems() {
    const sampleItemList = [];

    const orderedList = [];
    this.props.order.forEach(key => {
      const sampleID = this.props.sampleList[key].sampleID;
      if (this.props.queue.queue.includes(sampleID)) {
        orderedList.push(key);
      }
    });

    this.props.order.forEach(key => {
      const sample = this.props.sampleList[key];
      const liClass = this.props.moving[key] ? 'samples-grid-li-mv' : 'samples-grid-li';

      if (this.filter(key)) {
        sampleItemList.push(
          <li className={liClass} key={key}>
            <SampleGridItem
              itemKey={key}
              pickButtonOnClickHandler={this.sampleItemPickButtonOnClickHandler}
              moveButtonOnClickHandler={this.sampleItemMoveButtonOnClickHandler}
              onMoveHandler={this.sampleItemOnMoveHandler}
              allowedDirections={this.sampleItemCanMove(key)}
              sampleData={sample}
              queueOrder={orderedList.indexOf(key) + 1}
              selected={this.props.selected[sample.sampleID]}
              current={this.props.queue.current.sampleID === sample.sampleID}
              picked={this.props.inQueue(sample.sampleID)}
              moving={this.props.moving[key]}
            >
              {sample.tasks.map((taskData, i) => (
                 <TaskItem
                   key={i}
                   taskItemOnClick={this.taskItemOnClickHandler}
                   deleteButtonOnClick={this.taskItemDeleteButtonOnClickHandler}
                   taskData={taskData}
                   taskIndex={i}
                   rootPath={this.props.queue.rootPath}
                 />))
              }
            </SampleGridItem>
          </li>
        );
      }
    });

    return sampleItemList;
  }


  /**
   * Selects the SampleItem currently under the mouse cursor
   *
   * @param {MouseEvent} e
   */
  selectItemUnderCusor(e) {
    // Handling single item selection, create a syntheticElement to use for the
    // mouse cursor when doing the overlap detection, reusing the same
    // mechanism as for mutiple selection
    const syntheticElement = { getBoundingClientRect: () => {
      const bbox = { top: e.clientY, left: e.clientX,
                     bottom: e.clientY + 1, right: e.clientX + 1,
                     width: 1, height: 1 };
      return bbox;
    } };

    const selected = this.sampleItems.filter((sampleItem) => {
      const sampleElement = document.getElementById(sampleItem.key);
      return this.checkForOverlap(syntheticElement, sampleElement);
    }).map((sampleItem) => sampleItem.key);

    if (selected.length > 0) { this.sampleGridItemsSelectedHandler(e, selected); }
  }


  /**
   * Calculates the grid dimension
   *
   * return {array} array on the format [NumRowsCol1, NumRowsCol2, ... NumRowsColN]
   */
  gridDimension() {
    const colArray = [];
    const numItems = Object.keys(this.props.order).length;
    const numFullCols = Math.floor(this.calcGridWidth() / SAMPLE_ITEM_WIDTH);
    const numFullRows = Math.floor(numItems / numFullCols);
    const itemsOnLastRow = numItems - (numFullRows * numFullCols);

    for (let i = 0; i < numFullRows; i++) {
      colArray[i] = numFullCols;
    }

    if (itemsOnLastRow > 0) {
      colArray[numFullRows] = itemsOnLastRow;
    }

    return colArray;
  }


  /**
   * Calculates the grid width
   *
   * return {number} width in pixels
   */
  calcGridWidth() {
    // We know that the side menu is fixed width 65px and that the padding from
    // bootstrap is 15px so content starts at 80px;

    // Get the viewportWidth
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    // The full content width for this media (not forgeting the padding to the right 15px)
    const fullContentWidth = viewportWidth - 80 - 15;

    // Each sample item is 190px wide, calculate maximum number of items for each row
    const numCols = Math.floor(fullContentWidth / SAMPLE_ITEM_WIDTH);

    // Caculating the actual grid size, with space between sample items;
    const actualGridWidth = numCols * (SAMPLE_ITEM_WIDTH + 2 + SAMPLE_ITEM_SPACE) + 10;

    return actualGridWidth;
  }


  /**
   * Filter function for SamplItems
   *
   * @property {Object} sampleList
   * @property {string} filterText
   * @property {object} picked
   *
   * return {boolean} true if item is to be included otherwise false
   */
  filter(key) {
    const sample = this.props.sampleList[key];
    let sampleFilter = `${sample.sampleName} ${sample.proteinAcronym} `;
    sampleFilter += `${sample.code} ${sample.location.toLowerCase()}`;

    let filterItem = sampleFilter.includes(this.props.filterText.toLowerCase());

    if (this.props.filterText.includes('is:picked')) {
      filterItem = this.props.picked[key];
    }

    return filterItem;
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
        const intersection = sampleIDList.filter((sampleID) => (
          this.sampleItemIsSelected(sampleID)
        ));

        const union = Object.keys(this.props.selected).concat(sampleIDList);
        samplesToSelect = union.filter((sampleID) => !intersection.includes(sampleID));
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
    const [canMoveUp, canMoveDown, canMoveLeft, canMoveRight] = this.sampleItemCanMove(sampleID);

    if (dir === 'RIGHT' && canMoveRight) {
      targetPos = targetPos + 1;
    } else if (dir === 'LEFT' && canMoveLeft) {
      targetPos = targetPos - 1;
    } else if (dir === 'DOWN' && canMoveDown) {
      targetPos = targetPos + numCols;
    } else if (dir === 'UP' && canMoveUp) {
      targetPos = targetPos - numCols;
    } else {
      return;
    }

    const newSampleOrder = [...this.props.order];
    newSampleOrder.splice(targetPos, 0, newSampleOrder.splice(sourcePos, 1)[0]);
    this.props.setSampleOrderAction(newSampleOrder);
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

    if (Object.keys(this.props.selected).map(_key => this.props.selected[_key]).length === 1) {
      if (itemPos.col === 0) {
        left = false;
      }

      if (itemPos.row === 0) {
        up = false;
      }

      if (itemPos.row === (itemPos.gridDimension.length - 1)) {
        down = false;
      }

      if (itemPos.col > (itemPos.gridDimension[itemPos.row + 1] - 1)) {
        down = false;
      }

      if (itemPos.col === (itemPos.gridDimension[itemPos.row] - 1)) {
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
    const colPos = pos - (rowPos * numCols);

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


  render() {
    this.sampleItems = this.getSampleItems();
    const Grid = makeResponsive(measureItems(CSSGrid), { maxWidth: this.calcGridWidth() });

    return (
      <div
        className="samples-grid"
        onClick={this.onClickHandler}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
      >
        <ul id="contextMenu" style={{ display: 'none' }} className="dropdown-menu" role="menu">
          <MenuItem eventKey="1" onClick={this.props.addSelectedSamplesToQueue}>
            <span><Glyphicon glyph="unchecked" /> En-queue Sample </span>
          </MenuItem>
          <MenuItem divider />
          <MenuItem header> <span><Glyphicon glyph="plus" /> Add </span></MenuItem>
          <MenuItem eventKey="2" onClick={this.props.showDataCollectionForm}>
            Data collection
          </MenuItem>
          <MenuItem eventKey="3" onClick={this.props.showCharacterisationForm}>
            Characterisation
          </MenuItem>
          <MenuItem divider />
          <MenuItem header><span><Glyphicon glyph="minus" /> Remove </span></MenuItem>
          <MenuItem eventKey="1" onClick={this.props.removeSelectedSamples}>
            Remove tasks
          </MenuItem>
        </ul>
        <div className="selection-rubber-band" id="selectionRubberBand" />
        <Grid
          component="ul"
          columnWidth={SAMPLE_ITEM_WIDTH}
          gutterWidth={SAMPLE_ITEM_SPACE}
          gutterHeight={SAMPLE_ITEM_SPACE + 3}
          itemHeight={SAMPLE_ITEM_HEIGHT}
          layout={layout.simple}
          enter={enterExitStyle.simple.enter}
          entered={enterExitStyle.simple.entered}
          exit={enterExitStyle.simple.exit}
          duration={1000}
          easing={easings.quadOut}
        >
          {this.sampleItems}
        </Grid>
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
    queue: state.queue,
    selected: state.sampleGrid.selected,
    moving: state.sampleGrid.moving,
    sampleList: state.sampleGrid.sampleList,
    filterText: state.sampleGrid.filterText,
    order: state.sampleGrid.order,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setSampleOrderAction: (order) => dispatch(setSampleOrderAction(order)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    deleteTask: bindActionCreators(deleteTask, dispatch),
    toggleMovableAction: (key) => dispatch(toggleMovableAction(key)),
    selectSamples: (keys, selected) => dispatch(selectSamplesAction(keys, selected)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGrid);
