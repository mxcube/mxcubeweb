import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import cx from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import { Button, Col, Dropdown, Row, Table } from 'react-bootstrap';
import Collapsible from 'react-collapsible';
import { BiMenu } from 'react-icons/bi';
import {
  BsCheck2Square,
  BsChevronDown,
  BsChevronUp,
  BsDashSquare,
  BsSquare,
} from 'react-icons/bs';
import { Md360, MdFlare, MdRemove } from 'react-icons/md';
import LazyLoad, { forceVisible } from 'react-lazyload';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { bindActionCreators } from 'redux';

import { showDialog } from '../actions/general';
import { deleteTask } from '../actions/queue';
import { mountSample, unmountSample } from '../actions/sampleChanger';
import {
  selectSamplesAction,
  showGenericContextMenu,
} from '../actions/sampleGrid';
import { showTaskForm } from '../actions/taskForm';
import MXContextMenu from '../components/GenericContextMenu/MXContextMenu';
import SampleCircleView from '../components/SampleGrid/SampleCircleView';
import { SampleGridTableItem } from '../components/SampleGrid/SampleGridTableItem';
import { TaskItem } from '../components/SampleGrid/TaskItem';
import TooltipTrigger from '../components/TooltipTrigger';
import { isCollected, QUEUE_RUNNING, QUEUE_STOPPED } from '../constants';
import SampleFlexView from './SampleFlexView';
import SampleIsaraView from './SampleIsaraView';

const SETTINGS = {
  dots: false,
  infinite: false,
  speed: 100,
  slidesToShow: 6,
  slidesToScroll: 6,
};

const CELL_MENU_ID = 'samples-grid-table-context-menu-cell';
const PUCK_MENU_ID = 'samples-grid-table-context-menu-puck';
const MENU_ID = 'samples-grid-table-context-menu';
const MOUNTED_MENU_ID = 'samples-grid-table-context-menu-mounted';

function getWorkflowMenuOptions(workflows, showWorkflowForm) {
  const workflowTasks = {
    point: [],
    line: [],
    grid: [],
    samplegrid: [],
    none: [],
  };

  Object.values(workflows).forEach((wf) => {
    if (wf.requires.includes('point')) {
      workflowTasks.point.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else if (wf.requires.includes('line')) {
      workflowTasks.line.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else if (wf.requires.includes('grid')) {
      workflowTasks.grid.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else if (wf.requires.includes('samplegrid')) {
      workflowTasks.samplegrid.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    } else {
      workflowTasks.none.push({
        text: wf.wfname,
        handleAction: () => showWorkflowForm(wf),
        key: `wf-${wf.wfname}`,
      });
    }
  });

  return workflowTasks;
}

/**
 * Checks if the two DOMElements el1 and el2 overlap
 *
 * @param {DOMElement} el1
 * @param {DOMElement} el2
 * @return {boolean}
 */
function checkForOverlap(el1, el2) {
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

// Helper function to determine puck colsm value
function getColsm(isSingleCell, puckCount) {
  if (isSingleCell) {
    return puckCount <= 4 ? 3 : true;
  }
  return puckCount === 1 ? 2 : puckCount === 2 ? 4 : puckCount === 3 ? 6 : true;
}

export default function SampleGridTableContainer(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const filterOptions = useSelector((state) => state.sampleGrid.filterOptions);
  const selected = useSelector((state) => state.sampleGrid.selected);
  const queue = useSelector((state) => state.queue);
  const order = useSelector((state) => state.sampleGrid.order);
  const sampleChanger = useSelector((state) => state.sampleChanger);
  const contextMenu = useSelector(
    (state) => state.contextMenu.genericContextMenu,
  );
  const viewMode = useSelector((state) => state.sampleGrid.viewMode);
  const workflows = useSelector((state) => state.workflow.workflows);
  const defaultParameters = useSelector(
    (state) => state.taskForm.defaultParameters,
  );
  const availableMethods = new Set(Object.keys(defaultParameters));
  const selectionRubberBand = document.querySelector('#selectionRubberBand');

  const {
    addSelectedSamplesToQueue,
    addSamplesToQueue,
    showCharacterisationForm,
    showDataCollectionForm,
    showWorkflowForm,
    inQueue,
    inQueueDeleteElseAddSamples,
    removeSelectedSamples,
    removeSelectedTasks,
    filterSampleByKey,
    type,
  } = props;

  const [rubberBandVisible, setRubberBandVisible] = useState(false);

  const isSingleCell = Object.values(sampleList).every(
    (sample) => sample.cell_no === 1 || sample.cell_no === 0,
  );

  // this supose to replace old shouldComponentUpdate , not sure we need it
  useEffect(() => {
    console.log('Component Updated'); // eslint-disable-line no-console
  }, [filterOptions, queue.queue, sampleList, order]);

  /**
   * @param {MouseEvent} e
   */
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        dispatch(selectSamplesAction(Object.keys(sampleList), false));
        setRubberBandVisible(false);
        selectionRubberBand.style.display = 'none';
      }
    },
    [dispatch, sampleList, selectionRubberBand],
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  /**
   * @param {string} sampleID
   * @return {boolean} true if sample is selected
   */
  const sampleItemIsSelected = useCallback(
    (sampleID) => {
      return Object.keys(selected).includes(sampleID);
    },
    [selected],
  );

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
  const sampleGridItemsSelectedHandler = useCallback(
    (e, sampleIDList) => {
      const isAlreadySelected =
        sampleIDList.length === 1 && sampleItemIsSelected(sampleIDList[0]);
      let samplesToSelect = sampleIDList;

      // Ignore selection if right-clicking an already selected item
      if (isAlreadySelected && e.button === 2) {
        return;
      }

      // If CTRL is pressed, modify selection (toggle selected samples)
      if (e.ctrlKey) {
        const intersection = new Set(
          sampleIDList.filter((sampleID) => sampleItemIsSelected(sampleID)),
        );

        const union = [...Object.keys(selected), ...sampleIDList];
        samplesToSelect = union.filter(
          (sampleID) => !intersection.has(sampleID),
        );
      }

      dispatch(selectSamplesAction(samplesToSelect));
    },
    [selected, sampleItemIsSelected, dispatch],
  );

  /**
   * Selects the SampleItem currently under the mouse cursor
   *
   * @param {MouseEvent} e
   */
  function selectItemUnderCursor(e, item) {
    sampleGridItemsSelectedHandler(e, [item]);
  }

  /**
   * Handles multiple item selection on mouseDown, initializes the 'rubberband'
   * that outlines the selected area.
   *
   * @param {MouseEvent} e
   */
  function onMouseDown(e) {
    e.preventDefault();
    selectionRubberBand.style.top = `${e.clientY}px`;
    selectionRubberBand.style.left = `${e.clientX}px`;
    selectionRubberBand.style.width = 0;
    selectionRubberBand.style.height = 0;
    setRubberBandVisible(true);

    if (contextMenu.show) {
      dispatch(showGenericContextMenu(false, null, 0, 0));
      setRubberBandVisible(false);
      selectionRubberBand.style.display = 'none';
    }
    e.stopPropagation();
  }

  /**
   * Updates the rubberband if the mutiple selection was initiated (mouseDown
   * followed by mouseMove)
   *
   * @param {MouseEvent} e
   */
  function onMouseMove(e) {
    if (rubberBandVisible) {
      selectionRubberBand.style.display = 'block';
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
   * Selects the items under the selected area and hides the rubberband
   * @param {MouseEvent} e
   */
  function onMouseUp(e) {
    const samplesListFiltered = getSamplesList()
      .filter((sampleItem) => {
        // `sampleItem.key` may include a column (:), so we can't use `querySelector`
        // //eslint-disable-next-line unicorn/prefer-query-selector
        const sampleElement = document.getElementById(sampleItem.key);
        return checkForOverlap(selectionRubberBand, sampleElement);
      })
      .map((sampleItem) => sampleItem.key);

    selectionRubberBand.style.display = 'none';
    setRubberBandVisible(false);

    // If several samples selected call the handler, otherwise rely on
    // onClick handler to handle the click
    if (samplesListFiltered.length > 0) {
      sampleGridItemsSelectedHandler(e, samplesListFiltered);
    }
  }

  function currentSample(sampleID) {
    let current = false;

    if (queue.currentSampleID) {
      current = queue.currentSampleID === sampleID;
    } else if (sampleChanger.loadedSample.address) {
      current = sampleChanger.loadedSample.address === sampleID;
    }

    return current;
  }

  /**
   * Handles click on sample item pick 'checkbox', adds sample to queue if its
   * not in the queue or removes it from the queue if it was already in.
   *
   * @param {MouseEvent} e
   * @param {string} sampleID - sampleID to toggle (remove from or add to queue)
   */
  function sampleItemPickButtonOnClickHandler(e, sampleID) {
    e.stopPropagation();

    // If sample already in the set of selected samples, add all those samples
    // to queue
    if (sampleItemIsSelected(sampleID)) {
      inQueueDeleteElseAddSamples(Object.keys(selected), true);
    } else {
      // The sample is not in the set of selected samples (or no samples are
      // selected), select only sample with sampleID and add it queue
      dispatch(selectSamplesAction([sampleID]));
      inQueueDeleteElseAddSamples([sampleID], true);
    }
  }

  /**
   * Handles clicks on TaskItem
   *
   * @param {MouseEvent} e
   * @param {object} task - clicked task
   */

  function taskItemOnClickHandler(e, task) {
    e.stopPropagation();
    dispatch(showTaskForm(task.type, task.sampleID, task));
  }

  /**
   * Handels clicks on TaskItem delete button
   *
   * @param {MouseEvent} e
   * @param {string} sampleID - sampleID of the sample the tasks belong to
   * @param {number} taskIndex - index of task
   */
  function taskItemDeleteButtonOnClickHandler(e, sampleID, taskIndex) {
    e.stopPropagation();

    if (queue.queueStatus === QUEUE_STOPPED) {
      dispatch(deleteTask(sampleID, taskIndex));
    }
  }

  function pickAllCellPuckItemsOnClick(e, sampleItem, pickSample) {
    if (pickSample) {
      addSamplesToQueue(sampleItem);
    } else {
      inQueueDeleteElseAddSamples(sampleItem, false);
    }
    e.stopPropagation();
  }

  /**
   * Filter the sample list by Cell or by Puck
   *
   * @param {number} cellID - Each sample has cellID/cell_no
   * @param {number} puckID - Each sample has puckID/ puck_no
   * @param {boolean} useFilteredValue - whether to use redux store value or filter parameters
   */
  const getSampleListFilteredByCellPuck = useCallback(
    (cellID, puckID, useFilteredValue) => {
      if (!cellID) {
        return [[], [], '', null];
      }

      function filterSamples(filterFn) {
        return Object.values(sampleList)
          .filter(filterFn)
          .map((sample) => ({
            sample,
            sampleID: sample.sampleID,
            _inQueue: inQueue(sample.sampleID),
          }))
          .filter(({ sampleID }) =>
            filterSampleByKey(
              sampleID,
              useFilteredValue && cellID,
              useFilteredValue && puckID,
            ),
          );
      }

      function getAllSampleIDs(samples) {
        return samples.map(({ sampleID }) => sampleID);
      }

      function getInQueueSampleIDs(samples) {
        return samples
          .filter(({ _inQueue }) => _inQueue)
          .map(({ sampleID }) => sampleID);
      }

      function getPuckCode(samples) {
        return samples[0]?.sample?.containerCode
          ? `Code : ${samples[0].sample.containerCode}`
          : null;
      }

      const filteredSamples =
        puckID === null
          ? filterSamples((s) => s.cell_no === cellID)
          : filterSamples((s) => s.cell_no === cellID && s.puck_no === puckID);

      const puckSize = new Set(
        filteredSamples.map(({ sample }) => sample.puck_no),
      );
      return [
        getAllSampleIDs(filteredSamples),
        getInQueueSampleIDs(filteredSamples),
        getPuckCode(filteredSamples),
        puckSize.size,
      ];
    },
    [sampleList, inQueue, filterSampleByKey],
  );

  function displayContextMenu(e, contextMenuID, sampleID) {
    e.preventDefault();
    setRubberBandVisible(false);
    if (queue.queueStatus !== QUEUE_RUNNING) {
      dispatch(showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY));
    } // else TODO Show Alert

    selectItemUnderCursor(e, sampleID);
  }

  function displayPuckCellContextMenu(e, contextMenuID, cellID, puckID) {
    if (queue.queueStatus !== QUEUE_RUNNING) {
      dispatch(showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY));
    } // else TODO Show Alert

    const [selectedList] = getSampleListFilteredByCellPuck(
      cellID,
      puckID,
      true,
    );
    sampleGridItemsSelectedHandler(e, selectedList);
    e.stopPropagation();
  }

  function getSampleItemCollapsibleHeaderActions(cellID) {
    return (
      <div className="sample-items-collapsible-header-actions">
        <b className="me-2 mt-1">{isSingleCell ? null : `Cell ${cellID}`}</b>
        {sampleItemsControls(cellID, null)}
        <span
          title="Cell Options"
          className="samples-grid-table-context-menu-icon"
          onClick={(e) => {
            displayPuckCellContextMenu(e, CELL_MENU_ID, cellID, null);
          }}
        >
          <BiMenu size="1.5em" />
        </span>
      </div>
    );
  }

  function getCollapsibleHeaderOpen(cell, cssClass) {
    return (
      <div className="sample-items-collapsible-header">
        {getSampleItemCollapsibleHeaderActions(cell)}
        <BsChevronUp className={cssClass} size="1em" />
      </div>
    );
  }

  function getCollapsibleHeaderClose(cell, cssClass) {
    return (
      <div className="sample-items-collapsible-header">
        {getSampleItemCollapsibleHeaderActions(cell)}
        <BsChevronDown className={cssClass} size="1em" />
      </div>
    );
  }

  function getSamplesList() {
    const sampleItemList = [];

    order.forEach((key) => {
      const sample = sampleList[key];
      if (filterSampleByKey(key)) {
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
  function getSampleItems(cellID, puckID) {
    const filteredSamples = Object.values(sampleList).filter(
      (sample) => sample.cell_no === cellID && sample.puck_no === puckID,
    );

    return filteredSamples.length === 0
      ? null
      : filteredSamples
          .filter((sample) => filterSampleByKey(sample.sampleID))
          .map((sample) => {
            const key = sample.sampleID;
            const picked = inQueue(key);
            const isCurrent = currentSample(key);
            const contextMenuID = isCurrent ? MOUNTED_MENU_ID : MENU_ID;

            const classes = cx('samples-grid-table-li', {
              'samples-grid-table-item-selected': selected[key],
              'samples-grid-table-item-to-be-collected': picked,
              'samples-grid-table-item-collected': isCollected(sample),
              'samples-grid-table-li-manual': cellID === 0,
            });

            return (
              <div
                className={classes}
                key={key}
                onContextMenu={(e) => displayContextMenu(e, contextMenuID, key)}
                onClick={(e) => selectItemUnderCursor(e, key)}
              >
                <SampleGridTableItem
                  itemKey={key}
                  pickButtonOnClickHandler={sampleItemPickButtonOnClickHandler}
                  sampleData={sample}
                  queueOrder={
                    order
                      .filter((keys) => queue.queue.includes(keys))
                      .indexOf(key) + 1
                  }
                  selected={selected[key]}
                  current={isCurrent}
                  picked={picked}
                >
                  <Slider
                    className="samples-grid-table-item-tasks"
                    {...SETTINGS}
                  >
                    {sample.tasks.map((taskData, i) => (
                      <TaskItem
                        key={`task-${taskData.sampleID}`}
                        taskItemOnClick={taskItemOnClickHandler}
                        showDialog={bindActionCreators(showDialog, dispatch)}
                        deleteButtonOnClick={taskItemDeleteButtonOnClickHandler}
                        taskData={taskData}
                        taskIndex={i}
                      />
                    ))}
                  </Slider>
                </SampleGridTableItem>
              </div>
            );
          });
  }

  function getPuckList(scContent, cellID) {
    const puckFilterValue = Number(filterOptions.puckFilter); // Ensure numeric comparison

    return scContent.children.filter((puck, puckidx) => {
      const puckID = isSingleCell ? Number(puck.name) : puckidx + 1;
      const [filterList] = getSampleListFilteredByCellPuck(cellID, puckID);

      return (
        filterList.length > 0 &&
        (puckFilterValue === puckID || filterOptions.puckFilter === '')
      );
    });
  }

  function sampleItemsControls(cellID, puckID) {
    let icon = <BsSquare size="0.9em" />;
    let pickSample = true;

    const [allPuckSample, allPuckSampleCheck, puckCode] =
      getSampleListFilteredByCellPuck(cellID, puckID);

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
        {puckID && puckCode && (
          <span className="span-container-code"> {puckCode} </span>
        )}
        <TooltipTrigger
          id="pick-sample-tooltip"
          placement="auto"
          tooltipContent={
            pickSample
              ? 'Pick samples/ Add to Queue'
              : 'Unpick samples / Remove from Queue'
          }
        >
          <Button
            variant="link"
            className="pick-puck-checkbox-button"
            onClick={(e) =>
              pickAllCellPuckItemsOnClick(e, allPuckSample, pickSample)
            }
          >
            <i>{icon}</i>
          </Button>
        </TooltipTrigger>
      </>
    );
  }

  function sampleGridTable(cell, cellID, puckList) {
    return (
      <Table bordered responsive size="sm" className="sample-items-table">
        <thead>{tableHeader(cell, cellID, puckList)}</thead>
        <tbody>{tableBody(cell, cellID, puckList)}</tbody>
      </Table>
    );
  }

  function tableBody(cell, cellID, puckList) {
    return (
      <tr>
        {puckList.map((puck) => {
          const puckidx = cell.children.findIndex((p) => p.name === puck.name);
          const puckID = isSingleCell ? Number(puck.name) : puckidx + 1;
          return (
            <td
              key={`${cellID}-td-${puckID}`}
              className={`sample-items-table-column-body custom-table-border-${puckID}`}
            >
              {getSampleItems(cellID, puckID)}
            </td>
          );
        })}
      </tr>
    );
  }

  function tableHeader(cell, cellID, puckList) {
    return (
      <tr>
        {puckList.map((puck) => {
          const puckidx = cell.children.findIndex((p) => p.name === puck.name);
          const puckID = isSingleCell ? Number(puck.name) : puckidx + 1;

          return (
            <th
              key={`${cellID}-th-${puckID}`}
              className="sample-items-table-row-header-th"
            >
              <span className="puck-label">Puck {puckID}</span>
              <span className="puck-controls">
                {sampleItemsControls(cellID, puckID)}
              </span>
              <span
                className="samples-grid-table-context-menu-icon"
                title="Puck Options"
                onClick={(e) =>
                  displayPuckCellContextMenu(e, PUCK_MENU_ID, cellID, puckID)
                }
              >
                <BiMenu size="1.5em" />
              </span>
            </th>
          );
        })}
      </tr>
    );
  }

  // Render sample grid table  for single cell mode
  function getSingleCellPucks(cell, cellID, puckList, colsm) {
    return puckList.map((puck) => (
      <Col
        className="mt-2 p-2 sample-items-col"
        sm={colsm}
        key={`puck-${puck.name}`}
      >
        {sampleGridTable(cell, cellID, [puck])}
      </Col>
    ));
  }

  // render Sample grid for multiple cells mode
  function getMultipleCellPucks(cell, cellID, puckList, colsm) {
    return (
      <Col className="p-1" sm={colsm} key={`cell-${cellID}`}>
        <LazyLoad
          unmountIfInvisible
          once={cell.children.length <= 2}
          height={1325}
          offset={200 * cellID}
        >
          <Collapsible
            transitionTime={300}
            className="sample-items-collapsible"
            openedClassName="sample-items-collapsible"
            open
            onClosing={forceVisible()}
            lazyget
            trigger={getCollapsibleHeaderClose(cellID, 'collapsible-arrow-c')}
            triggerWhenOpen={getCollapsibleHeaderOpen(
              cellID,
              'collapsible-arrow-c',
            )}
          >
            {sampleGridTable(cell, cellID, puckList)}
          </Collapsible>
        </LazyLoad>
      </Col>
    );
  }

  function getManualSamples() {
    const manualSamples = Object.values(sampleList).filter(
      (sample) => sample.location === 'Manual',
    );

    if (manualSamples.length === 0) {
      return null;
    }

    const items = getSampleItems(0, 1);
    // Split the items array into rows of 6 elements each
    // Create a 2D array where each sub-array represents a row of items
    const numRows = Math.ceil(items.length / 6);
    const rows = Array.from({ length: numRows }, (_, i) =>
      items.slice(i * 6, i * 6 + 6),
    );

    return (
      <Col className="col-sm-12 mb-1">
        {items.length > 0 && <b className="me-2 mt-1">Manual Samples</b>}
        {rows.map((row, _) => (
          <div // eslint-disable-line react/jsx-key
            className="d-flex"
            style={{ alignItems: 'left', justifyContent: 'flex-start' }}
          >
            {row}
          </div>
        ))}
      </Col>
    );
  }

  function getSampleListAsTable() {
    let scContent = sampleChanger?.contents;
    if (!scContent?.children) {
      return null;
    }

    if (isSingleCell) {
      scContent = { children: [{ name: 1, children: scContent.children }] };
    }

    return scContent.children.map((cell) => {
      const cellID = Number(cell.name);
      const puckList = getPuckList(cell, cellID);
      if (puckList.length === 0) {
        return null;
      }

      const colsm = getColsm(isSingleCell, puckList.length);

      return isSingleCell
        ? getSingleCellPucks(cell, cellID, puckList, colsm)
        : getMultipleCellPucks(cell, cellID, puckList, colsm);
    });
  }

  function mountAndCollect() {
    let sampleData = null;

    // If several samples selected mount the first one and add the others to the queue
    order.some((sampleID) => {
      if (selected[sampleID]) {
        sampleData = sampleList[sampleID];
      }
      return selected[sampleID] === true;
    });

    if (sampleData) {
      dispatch(mountSample(sampleData));
      navigate('/datacollection', { replace: true });
    }
  }

  function unmount() {
    dispatch(unmountSample());
  }

  function getTaskContextMenuItems() {
    return (
      <>
        <Dropdown.Divider />
        <Dropdown.Header>
          <i className="fas fa-plus" /> Add{' '}
        </Dropdown.Header>
        {availableMethods.has('datacollection') ? (
          <Dropdown.Item onClick={showDataCollectionForm}>
            Data collection
          </Dropdown.Item>
        ) : null}
        {availableMethods.has('characterisation') ? (
          <Dropdown.Item onClick={showCharacterisationForm}>
            Characterisation
          </Dropdown.Item>
        ) : null}
        {getWorkflowMenuOptions(workflows, showWorkflowForm).samplegrid.map(
          (wf) => (
            <Dropdown.Item onClick={wf.handleAction} key={wf.key}>
              {wf.text}
            </Dropdown.Item>
          ),
        )}
        <Dropdown.Divider />
        <Dropdown.Header>
          <MdRemove glyph="minus" /> Remove
        </Dropdown.Header>
        <Dropdown.Item onClick={removeSelectedSamples}>
          Dequeue Samples
        </Dropdown.Item>
        <Dropdown.Item onClick={removeSelectedTasks}>
          Remove Tasks
        </Dropdown.Item>
      </>
    );
  }

  function getSampleContextMenu() {
    return (
      <>
        <Dropdown.Item onClick={addSelectedSamplesToQueue}>
          <span>
            <i className="fas fa-plus" /> Add to Queue
          </span>
        </Dropdown.Item>
        <Dropdown.Item onClick={mountAndCollect}>
          <span>
            <MdFlare glyph="screenshot" /> Mount{' '}
          </span>
        </Dropdown.Item>
      </>
    );
  }

  function getSampleContextMenuMounted() {
    return (
      <>
        <Dropdown.Item onClick={addSelectedSamplesToQueue}>
          <span>
            <i className="fas fa-plus" /> Add to Queue
          </span>
        </Dropdown.Item>
        <Dropdown.Item onClick={unmount}>
          <span>
            <Md360 glyph="share-alt" /> Unmount{' '}
          </span>
        </Dropdown.Item>
      </>
    );
  }

  function getContextMenu(id) {
    let menu = <Dropdown.Item href="#/action-1">....</Dropdown.Item>;
    switch (id) {
      case MENU_ID: {
        menu = (
          <>
            {getSampleContextMenu()}
            {getTaskContextMenuItems()}
          </>
        );

        break;
      }
      case MOUNTED_MENU_ID: {
        menu = (
          <>
            {getSampleContextMenuMounted()}
            {getTaskContextMenuItems()}
          </>
        );

        break;
      }
      case CELL_MENU_ID: {
        menu = (
          <>
            <Dropdown.Header>Cell Actions</Dropdown.Header>
            {getTaskContextMenuItems()}
          </>
        );

        break;
      }
      case PUCK_MENU_ID: {
        menu = (
          <>
            <Dropdown.Header>Puck Actions</Dropdown.Header>
            {getTaskContextMenuItems()}
          </>
        );

        break;
      }
      // No default
    }

    return menu;
  }

  function getSampleListAsDrawing() {
    const isCATS = type.includes('CATS');
    const isFLEX = type.includes('FLEX');
    const isMOCK = type.includes('Mock');

    if (isCATS) {
      return <SampleIsaraView />;
    }

    if (isFLEX) {
      return (
        <SampleFlexView
          displayPuckCellContextMenu={displayPuckCellContextMenu}
          cellMenuID={CELL_MENU_ID}
          puckMenuID={PUCK_MENU_ID}
          type={type}
        />
      );
    }
    if (isSingleCell || isMOCK) {
      return (
        <SampleCircleView
          displayPuckCellContextMenu={displayPuckCellContextMenu}
          puckMenuID={PUCK_MENU_ID}
          type={type}
        />
      );
    }

    return null;
  }

  if (Object.values(sampleList).length === 0) {
    return null;
  }

  return (
    <div>
      <MXContextMenu>{getContextMenu(contextMenu.id)}</MXContextMenu>
      <Row
        className="samples-grid-table"
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        xs="auto"
      >
        <div className="selection-rubber-band" id="selectionRubberBand" />
        {getManualSamples()}
        {viewMode.mode === 'Graphical View' ? (
          <>
            {getSampleListAsDrawing()}
            {getSampleListAsTable()}
          </>
        ) : (
          getSampleListAsTable()
        )}
      </Row>
    </div>
  );
}
