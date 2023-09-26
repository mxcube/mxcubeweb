import React from 'react';
import withRouter from '../components/WithRouter';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Row,
  Col,
  Table,
  OverlayTrigger,
  Tooltip,
  Button,
  Dropdown,
} from 'react-bootstrap';

import LazyLoad from 'react-lazyload';
import Collapsible from 'react-collapsible';

import 'react-contexify/dist/ReactContexify.css';

import { MdRemove, MdFlare, Md360 } from 'react-icons/md';
import {
  BsSquare,
  BsCheck2Square,
  BsDashSquare,
  BsChevronUp,
  BsChevronDown,
} from 'react-icons/bs';

import { BiMenu } from 'react-icons/bi';

import MXContextMenu from '../components/GenericContextMenu/MXContextMenu';

import classNames from 'classnames';

import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
  showGenericContextMenu,
} from '../actions/sampleGrid';

import { deleteTask, addSampleAndMount } from '../actions/queue';

import { unloadSample } from '../actions/sampleChanger';

import { showTaskForm } from '../actions/taskForm';

import { showDialog } from '../actions/general';

import SampleFlexView from './SampleFlexView';
import SampleIsaraView from './SampleIsaraView';

import { SampleGridTableItem } from '../components/SampleGrid/SampleGridTableItem';

import { TaskItem } from '../components/SampleGrid/TaskItem';

class SampleGridTableContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadGridTable: false,
    };
    this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);

    this.filter = this.filter.bind(this);
    this.mutualExclusiveFilterOption =
      this.mutualExclusiveFilterOption.bind(this);
    this.sampleGridItemsSelectedHandler =
      this.sampleGridItemsSelectedHandler.bind(this);
    this.inQueueSampleID = this.inQueueSampleID.bind(this);

    this.pickAllCellPuckItemsOnClick =
      this.pickAllCellPuckItemsOnClick.bind(this);

    this.currentSample = this.currentSample.bind(this);
    this.getSampleTable = this.getSampleTable.bind(this);
    this.getSampleItems = this.getSampleItems.bind(this);

    this.getSampleListBydCell = this.getSampleListBydCell.bind(this);
    this.getSamplesList = this.getSamplesList.bind(this);

    this.displayContextMenu = this.displayContextMenu.bind(this);
    this.displayPuckCellContextMenu =
      this.displayPuckCellContextMenu.bind(this);

    this.selectItemUnderCursor = this.selectItemUnderCursor.bind(this);
    this.sampleItemPickButtonOnClickHandler =
      this.sampleItemPickButtonOnClickHandler.bind(this);
    this.sampleItemIsSelected = this.sampleItemIsSelected.bind(this);

    this.taskItemDeleteButtonOnClickHandler =
      this.taskItemDeleteButtonOnClickHandler.bind(this);
    this.taskItemOnClickHandler = this.taskItemOnClickHandler.bind(this);

    this.showRubberBand = false;

    this.workflowMenuOptions = this.workflowMenuOptions.bind(this);
    this.mountAndCollect = this.mountAndCollect.bind(this);
    this.unmount = this.unmount.bind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('click', this.onClick, false);

    setTimeout(() => {
      this.setState({
        loadGridTable: true,
      });
    }, 50);
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
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('click', this.onClick);
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
        const intersection = new Set(
          sampleIDList.filter((sampleID) =>
            this.sampleItemIsSelected(sampleID),
          ),
        );

        const union = Object.keys(this.props.selected).concat(sampleIDList);
        samplesToSelect = union.filter(
          (sampleID) => !intersection.has(sampleID),
        );
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

    if (el2 === null || el1 === null) {
      return false;
    }
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
    selectionRubberBand.style.top = `${e.clientY}px`;
    selectionRubberBand.style.left = `${e.clientX}px`;
    selectionRubberBand.style.width = '0px';
    selectionRubberBand.style.height = '0px';
    this.showRubberBand = true;

    if (this.props.contextMenu.show) {
      this.props.showGenericContextMenu(false, null, 0, 0);
      this.showRubberBand = false;
      selectionRubberBand.style.display = 'none';
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
      const selectionRubberBand = document.querySelector(
        '#selectionRubberBand',
      );
      document.querySelector('#selectionRubberBand').style.display = 'block';
      selectionRubberBand.style.width = `${
        e.clientX - selectionRubberBand.offsetLeft
      }px`;
      selectionRubberBand.style.height = `${
        e.clientY - selectionRubberBand.offsetTop
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

    const selected = this.getSamplesList()
      .filter((sampleItem) => {
        const sampleElement = document.getElementById(sampleItem.key);
        return this.checkForOverlap(selectionRubberBand, sampleElement);
      })
      .map((sampleItem) => sampleItem.key);

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
        const selectionRubberBand = document.querySelector(
          '#selectionRubberBand',
        );
        this.showRubberBand = false;
        selectionRubberBand.style.display = 'none';
        break;
      }
      // No default
    }
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

      fi = sampleFilter.includes(this.props.filterOptions.text.toLowerCase());

      fi &= this.mutualExclusiveFilterOption(
        sample,
        'inQueue',
        'notInQueue',
        this.inQueueSampleID,
      );
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'collected',
        'notCollected',
        isCollected,
      );
      fi &= this.mutualExclusiveFilterOption(
        sample,
        'limsSamples',
        '',
        hasLimsData,
      );
    }

    return fi;
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
      this.props.inQueueDeleteElseAddSamples(
        Object.keys(this.props.selected),
        true,
      );
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
   * Handles clicks on TaskItem
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
   * Select Items in a cell for collect
   */
  pickAllCellPuckItemsOnClick(e, sampleItem, pickSample) {
    if (pickSample) {
      this.props.addSamplesToQueue(sampleItem);
    } else {
      this.props.inQueueDeleteElseAddSamples(sampleItem, false);
    }
    e.stopPropagation();
  }

  getSampleListBydCell(cell) {
    const allCellSample = [];
    const allCellSampleCheck = [];

    Object.values(this.props.sampleList)
      .filter((sample) => sample.cell_no === cell)
      .forEach((sample) => {
        allCellSample.push(sample.sampleID);
        if (this.props.inQueue(sample.sampleID) && sample.checked) {
          allCellSampleCheck.push(sample.sampleID);
        }
      });
    return [allCellSample, allCellSampleCheck];
  }

  getSampleListFilteredByCellPuck(cell, puck) {
    const allCellSample = [];
    const allCellSampleCheck = [];
    let puck_code;

    const allPuckSample = [];
    const allPuckSampleID = [];
    const allPuckSampleCheck = [];

    if (cell && puck === null) {
      Object.values(this.props.sampleList)
        .filter((sample) => sample.cell_no === cell)
        .forEach((sample) => {
          if (this.filter(sample.sampleID)) {
            allCellSample.push(sample.sampleID);
            if (this.props.inQueue(sample.sampleID) && sample.checked) {
              allCellSampleCheck.push(sample.sampleID);
            }
          }
        });
      return [allCellSample, allCellSampleCheck];
    } else if (puck !== null) {
      Object.values(this.props.sampleList)
        .filter((sample) => sample.cell_no === cell && sample.puck_no === puck)
        .forEach((sample) => {
          if (this.filter(sample.sampleID)) {
            allPuckSampleID.push(sample.sampleID);
            allPuckSample.push(sample);
            if (this.props.inQueue(sample.sampleID) && sample.checked) {
              allPuckSampleCheck.push(sample.sampleID);
            }
          }
        });

      puck_code = allPuckSample[0].containerCode || '';
      if (puck_code !== '') {
        puck_code = `| Code : ${puck_code}`;
      }
      return [allPuckSampleID, allPuckSampleCheck, puck_code];
    }

    return [[], [], ''];
  }

  displayContextMenu(e, contextMenuID, sampleID) {
    e.preventDefault();
    this.showRubberBand = false;
    if (this.props.queue.queueStatus !== QUEUE_RUNNING) {
      this.props.showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY);
    }
    this.selectItemUnderCursor(e, sampleID);
  }

  displayPuckCellContextMenu(e, contextMenuID, cell, puck) {
    if (this.props.queue.queueStatus !== QUEUE_RUNNING) {
      this.props.showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY);
    }

    const selectedList = this.getSampleListFilteredByCellPuck(cell, puck)[0];

    this.sampleGridItemsSelectedHandler(e, selectedList);
    e.stopPropagation();
  }

  itemsControls(cell, puck) {
    let icon = <BsSquare size="0.9em" />;
    let pickSample = true;
    const filterList = this.getSampleListFilteredByCellPuck(cell, puck);

    const allPuckSample = filterList[0];
    const allPuckSampleCheck = filterList[1];
    const puckCode = filterList[2];

    if (allPuckSample.length === allPuckSampleCheck.length) {
      icon = <BsCheck2Square size="0.9em" />;
      pickSample = false;
    } else if (
      allPuckSample.length !== allPuckSampleCheck.length &&
      allPuckSampleCheck.length > 0
    ) {
      icon = <BsDashSquare size="0.9em" />;
      pickSample = false;
    }

    return (
      <>
        {puck ? (
          <span className="span-container-code"> {puckCode} </span>
        ) : null}
        <OverlayTrigger
          placement="auto"
          overlay={
            <Tooltip id="pick-sample">
              {pickSample
                ? 'Pick samples/ Add to Queue'
                : 'Unpick samples / Remove from Queue'}
            </Tooltip>
          }
        >
          <Button
            variant="link"
            disabled={this.props.current && this.props.picked}
            className="pick-puck-checkbox-button"
            onClick={(e) =>
              this.pickAllCellPuckItemsOnClick(e, allPuckSample, pickSample)
            }
          >
            <i>{icon}</i>
          </Button>
        </OverlayTrigger>
      </>
    );
  }

  getSampleItemCollapsibleHeaderActions(cell) {
    const type = this.props.type;
    const cellMenuID = 'samples-grid-table-context-menu-cell';
    return (
      <div className="sample-items-collapsible-header-actions">
        <b className="me-2 mt-1">
          {type === 'CATS' ? 'Isara' : `Cell ${cell}`}
        </b>
        {this.itemsControls(cell, null)}
        <span
          title="Cell Options"
          className="samples-grid-table-context-menu-icon"
          onClick={(e) => {
            this.displayPuckCellContextMenu(e, cellMenuID, cell, null);
          }}
        >
          <BiMenu size="1.5em" />
        </span>
      </div>
    );
  }

  getCollapsibleHeaderOpen(cell, cssClass) {
    return (
      <div className="sample-items-collapsible-header">
        {this.getSampleItemCollapsibleHeaderActions(cell)}
        <BsChevronUp className={cssClass} size="1em" />
      </div>
    );
  }

  getCollapsibleHeaderClose(cell, cssClass) {
    return (
      <div className="sample-items-collapsible-header">
        {this.getSampleItemCollapsibleHeaderActions(cell)}
        <BsChevronDown className={cssClass} size="1em" />
      </div>
    );
  }

  getSamplesList() {
    const sampleItemList = [];

    this.props.order.forEach((key) => {
      const sample = this.props.sampleList[key];
      if (this.filter(key)) {
        sampleItemList.push(<li key={key}>{sample.sampleID}</li>);
      }
    });

    return sampleItemList;
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
  getSampleItems(cell, puck) {
    const sampleItemList = [];

    Object.values(this.props.sampleList)
      .filter((sample) => sample.cell_no === cell && sample.puck_no === puck)
      .forEach((sample) => {
        const key = sample.sampleID;

        const picked = this.props.inQueue(sample.sampleID) && sample.checked;

        const classes = classNames('samples-grid-table-li', {
          'samples-grid-table-item-selected':
            this.props.selected[sample.sampleID],
          'samples-grid-table-item-to-be-collected': picked,
          'samples-grid-table-item-collected': isCollected(sample),
        });

        const settings = {
          dots: false,
          infinite: false,
          speed: 100,
          slidesToShow: 6,
          slidesToScroll: 6,
        };

        if (
          this.filter(key) &&
          sample.cell_no === cell &&
          sample.puck_no === puck
        ) {
          let contextMenuID = 'samples-grid-table-context-menu';
          if (this.currentSample(sample.sampleID)) {
            contextMenuID = 'samples-grid-table-context-menu-mounted';
          }

          sampleItemList.push(
            <div
              className={classes}
              key={key}
              onContextMenu={(e) => {
                this.displayContextMenu(e, contextMenuID, sample.sampleID);
              }}
              onClick={(e) => {
                this.selectItemUnderCursor(e, sample.sampleID);
              }}
            >
              <SampleGridTableItem
                key={key}
                itemKey={key}
                pickButtonOnClickHandler={
                  this.sampleItemPickButtonOnClickHandler
                }
                sampleData={sample}
                queueOrder={
                  this.props.order
                    .filter(
                      (keys) =>
                        this.props.queue.queue.includes(keys) &&
                        this.props.sampleList[keys].checked,
                    )
                    .indexOf(key) + 1
                }
                selected={this.props.selected[sample.sampleID]}
                current={this.currentSample(sample.sampleID)}
                picked={picked}
              >
                <Slider className="samples-grid-table-item-tasks" {...settings}>
                  {sample.tasks.map((taskData, i) => (
                    <TaskItem
                      key={`task-${i}`}
                      taskItemOnClick={this.taskItemOnClickHandler}
                      showDialog={this.props.showDialog}
                      deleteButtonOnClick={
                        this.taskItemDeleteButtonOnClickHandler
                      }
                      taskData={taskData}
                      taskIndex={i}
                    />
                  ))}
                </Slider>
              </SampleGridTableItem>
            </div>,
          );
        }
        return null;
      });

    return sampleItemList;
  }

  getManualSamples() {
    const scList = this.props.sampleList;
    const manualSamples = [];
    const ks = Object.keys(scList);
    ks.forEach((sample) => {
      if (scList[sample].location === 'Manual') {
        scList[sample].cell_no = 0;
        manualSamples.push(scList[sample]);
      }
    });

    if (manualSamples.length > 0) {
      const items = this.getSampleItems(0, 1);
      const rows = [];

      // we divide all manual samples in rows of 6 samples
      const numRows = Math.ceil(items.length / 6);
      let sliceStart = 0;
      let sliceEnd = 6;
      for (let i = 0; i <= numRows; i++) {
        rows[i] = items.slice(sliceStart, sliceEnd);
        sliceStart += 6;
        sliceEnd += 6;
      }

      return (
        <div className="col-sm-2">
          <b className="me-2 mt-1">Manual Samples</b>
          {rows.map((r) => {
            return (
              <div
                className="d-flex"
                style={{ alignItems: 'left', justifyContent: 'flex-start' }}
              >
                {r}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }

  getSampleTable(colsm) {
    const scContent = this.props.sampleChanger.contents;
    const tableCell = [];

    scContent.children.map((cell) => {
      if (
        this.props.filterOptions.cellFilter.toLowerCase() === cell.name ||
        this.props.filterOptions.cellFilter.toLowerCase() === ''
      ) {
        const nbpuck = [];
        // we won't display the cell / table  if all puck in the cell are empty
        cell.children.map((puck, idxtd) => {
          if (
            this.getSampleItems(Number(cell.name), idxtd + 1).length > 0 &&
            (Number(this.props.filterOptions.puckFilter) === idxtd + 1 ||
              this.props.filterOptions.puckFilter.toLowerCase() === '')
          ) {
            nbpuck.push(puck);
          }
        });

        if (nbpuck.length > 0) {
          let colsmP;
          if (nbpuck.length === 1) {
            colsmP = 3;
          } else if (nbpuck.length >= 4 && colsm === 'auto') {
            colsmP = 12;
          } else {
            colsmP = colsm;
          }
          tableCell.push(
            <Col sm={colsmP} key={`cell-${cell.name}`}>
              <LazyLoad
                unmountIfInvisible
                once={scContent.children.length <= 2}
                height={1325}
                offset={100}
              >
                <Collapsible
                  transitionTime={300}
                  className="sample-items-collapsible"
                  openedClassName="sample-items-collapsible"
                  open
                  lazyRender
                  trigger={this.getCollapsibleHeaderClose(
                    Number(cell.name),
                    'collapsible-arrow-c',
                  )}
                  triggerWhenOpen={this.getCollapsibleHeaderOpen(
                    Number(cell.name),
                    'collapsible-arrow-c',
                  )}
                >
                  <Table
                    bordered
                    responsive
                    size="sm"
                    className="sample-items-table"
                  >
                    <thead>
                      <tr>
                        {cell.children.map((puck, idxth) => {
                          if (
                            (Number(this.props.filterOptions.puckFilter) ===
                              idxth + 1 ||
                              this.props.filterOptions.puckFilter.toLowerCase() ===
                                '') &&
                            this.getSampleItems(Number(cell.name), idxth + 1)
                              .length > 0
                          ) {
                            const puckMenuID =
                              'samples-grid-table-context-menu-puck';
                            return (
                              <th
                                key={`${cell.name}-th-${puck.name}`}
                                className="sample-items-table-row-header-th"
                              >
                                <span
                                  style={{
                                    marginLeft: '5px',
                                    marginTop: '6px',
                                    float: 'left',
                                  }}
                                >
                                  Puck {idxth + 1}
                                </span>
                                <span
                                  style={{
                                    marginTop: '15px',
                                    marginRight: '2px',
                                  }}
                                >
                                  {this.itemsControls(
                                    Number(cell.name),
                                    idxth + 1,
                                  )}
                                </span>
                                <span
                                  title="Puck Options"
                                  className="samples-grid-table-context-menu-icon"
                                  onClick={(e) => {
                                    this.displayPuckCellContextMenu(
                                      e,
                                      puckMenuID,
                                      Number(cell.name),
                                      idxth + 1,
                                    );
                                  }}
                                >
                                  <BiMenu size="1.5em" />
                                </span>
                              </th>
                            );
                          }
                          return null;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {cell.children.map((puck, idxtd) => {
                          if (
                            (Number(this.props.filterOptions.puckFilter) ===
                              idxtd + 1 ||
                              this.props.filterOptions.puckFilter.toLowerCase() ===
                                '') &&
                            this.getSampleItems(Number(cell.name), idxtd + 1)
                              .length > 0
                          ) {
                            return (
                              <td
                                key={`${cell.name}-td-${puck.name}`}
                                className={`sample-items-table-column-body custom-table-border-${
                                  idxtd + 1
                                }`}
                              >
                                {this.getSampleItems(
                                  Number(cell.name),
                                  idxtd + 1,
                                )}
                              </td>
                            );
                          }
                          return null;
                        })}
                      </tr>
                    </tbody>
                  </Table>
                </Collapsible>
              </LazyLoad>
            </Col>,
          );
        }
      }
      return null;
    });
    return tableCell;
  }

  /**
   * Returns menu options for workflow tasks
   *
   * @property {Object} workflows
   *
   * return {array} Array of <Dropdown.Item>
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
      this.props.router.navigate('/datacollection', { replace: true });
    }
  }

  unmount() {
    this.props.unloadSample();
  }

  taskContextMenuItems() {
    return (
      <>
        <Dropdown.Divider />
        <Dropdown.Header>
          <i className="fas fa-plus" /> Add{' '}
        </Dropdown.Header>
        <Dropdown.Item onClick={this.props.showDataCollectionForm}>
          Data collection
        </Dropdown.Item>
        <Dropdown.Item onClick={this.props.showCharacterisationForm}>
          Characterisation
        </Dropdown.Item>
        {this.workflowMenuOptions()}
        <Dropdown.Divider />
        <Dropdown.Header>
          <MdRemove glyph="minus" /> Remove
        </Dropdown.Header>
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
          <span>
            <i className="fas fa-plus" />
            Add to Queue
          </span>
        </Dropdown.Item>
        <Dropdown.Item onClick={this.mountAndCollect}>
          <span>
            <MdFlare glyph="screenshot" /> Mount{' '}
          </span>
        </Dropdown.Item>
      </>
    );
  }

  sampleContextMenuMounted() {
    return (
      <>
        <Dropdown.Item onClick={this.props.addSelectedSamplesToQueue}>
          <span>
            <i className="fas fa-plus" /> Add to Queue
          </span>
        </Dropdown.Item>
        <Dropdown.Item onClick={this.unmount}>
          <span>
            <Md360 glyph="share-alt" /> Unmount{' '}
          </span>
        </Dropdown.Item>
      </>
    );
  }

  renderContextMenu(id) {
    let menu = <Dropdown.Item href="#/action-1">....</Dropdown.Item>;
    switch (id) {
      case 'samples-grid-table-context-menu': {
        menu = (
          <>
            {this.sampleContextMenu()}
            {this.taskContextMenuItems()}
          </>
        );

        break;
      }
      case 'samples-grid-table-context-menu-mounted': {
        menu = (
          <>
            {this.sampleContextMenuMounted()}
            {this.taskContextMenuItems()}
          </>
        );

        break;
      }
      case 'samples-grid-table-context-menu-cell': {
        menu = (
          <>
            <Dropdown.Header>Cell Actions</Dropdown.Header>
            {this.taskContextMenuItems()}
          </>
        );

        break;
      }
      case 'samples-grid-table-context-menu-puck': {
        menu = (
          <>
            <Dropdown.Header>Puck Actions</Dropdown.Header>
            {this.taskContextMenuItems()}
          </>
        );

        break;
      }
      // No default
    }

    return menu;
  }

  isSingleCell() {
    return Object.values(this.props.sampleList).every(
      (sample) => sample.cell_no === 1,
    );
  }

  renderSampleChangerDrawing() {
    if (this.props.type === 'CATS') {
      return <SampleIsaraView cellSampleList={this.getSampleListBydCell} />;
    } else if (this.props.type === 'FLEX_HCD') {
      return <SampleFlexView cellSampleList={this.getSampleListBydCell} />;
    } else {
      return null;
    }
  }

  render() {
    return this.state.loadGridTable ? (
      <div>
        {this.props.contextMenu.show ? (
          <MXContextMenu
            id={this.props.contextMenu.id}
            show={this.props.contextMenu.show}
            x={this.props.contextMenu.x}
            y={this.props.contextMenu.y}
          >
            {this.renderContextMenu(this.props.contextMenu.id)}
          </MXContextMenu>
        ) : null}
        {this.props.viewMode.mode === 'Graphical View' ? (
          <Row
            className="samples-grid-table"
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            onMouseMove={this.onMouseMove}
            xs="auto"
          >
            <div className="selection-rubber-band" id="selectionRubberBand" />
            {this.renderSampleChangerDrawing()}
            <Col className="col-sm-10">
              {this.getManualSamples()}
              {this.getSampleTable('auto')}
            </Col>
          </Row>
        ) : (
          <Row
            className="samples-grid-table"
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            onMouseMove={this.onMouseMove}
            xs="auto"
            ref={(ref) => {
              this.containerRef = ref;
            }}
          >
            <div className="selection-rubber-band" id="selectionRubberBand" />
            {this.getManualSamples()}
            {this.getSampleTable(this.isSingleCell() ? 12 : 6)}
          </Row>
        )}
      </div>
    ) : (
      <div className="widget loading">loading...</div>
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
    sampleChanger: state.sampleChanger,
    type: state.sampleChanger.contents
      ? state.sampleChanger.contents.name
      : '"Mockup"',
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
    showGenericContextMenu: (show, id, x, y) =>
      dispatch(showGenericContextMenu(show, id, x, y)),
    selectSamples: (keys, selected) =>
      dispatch(selectSamplesAction(keys, selected)),
    addSampleAndMount: bindActionCreators(addSampleAndMount, dispatch),
    showDialog: bindActionCreators(showDialog, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(SampleGridTableContainer));
