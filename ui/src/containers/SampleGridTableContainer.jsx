import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Row, Col, Dropdown } from 'react-bootstrap';
import { BsChevronUp, BsChevronDown } from 'react-icons/bs';
import { BiMenu } from 'react-icons/bi';
import { MdRemove, MdFlare, Md360 } from 'react-icons/md';
import LazyLoad, { forceVisible } from 'react-lazyload';
import Collapsible from 'react-collapsible';
import cx from 'classnames';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import MXContextMenu from '../components/GenericContextMenu/MXContextMenu';
// import CollapseHorizontal from '../components/CollapseHorizontal';
import SampleGridTable from '../components/SampleGrid/SampleGridTable';
import ManualSamples from '../components/SampleGrid/ManualSamples';
import SampleGridTableItem from '../components/SampleGrid/SampleGridTableItem';
import { TaskItem } from '../components/SampleGrid/TaskItem';
import SampleFlexView from '../components/SampleGrid/SampleFlexView';
import SampleItemsControls from '../components/SampleGrid/SampleItemsControls';
import SampleIsaraView from '../components/SampleGrid/SampleIsaraView';
import {
  selectSamplesAction,
  showGenericContextMenu,
} from '../actions/sampleGrid';

import { QUEUE_STOPPED, QUEUE_RUNNING, isCollected } from '../constants';

import { deleteTask } from '../actions/queue';

import { unmountSample, mountSample } from '../actions/sampleChanger';

import { showTaskForm } from '../actions/taskForm';

import { showDialog } from '../actions/general';

import {
  getWorkflowMenuOptions,
  checkForOverlap,
  getColsm,
} from '../components/SampleGrid/utils';

const SETTINGS = {
  dots: false,
  infinite: false,
  speed: 100,
  slidesToShow: 6,
  slidesToScroll: 6,
};

const CELL_MENU_ID = 'samples-grid-table-context-menu-cell';
const MENU_ID = 'samples-grid-table-context-menu';
const MOUNTED_MENU_ID = 'samples-grid-table-context-menu-mounted';
const PUCK_MENU_ID = 'samples-grid-table-context-menu-puck';
/**
 * @property {Object} sampleList - list of samples
 * @property {array} order - order of samples within sample list
 * @property {array} queue - samples in queue
 * @property {object} selected - contains samples that are currently selected
 */
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

  const selectionRubberBand = document.querySelector('#selectionRubberBand');

  const {
    addSelectedSamplesToQueue,
    addSamplesToQueue,
    showCharacterisationForm,
    showDataCollectionForm,
    showWorkflowForm,
    inQueue,
    inQueueDeleteElseAddSamples,
    // removeSamplesFromQueue,
    removeSelectedSamples,
    removeSelectedTasks,
    filterSampleByKey,
    type,
  } = props;

  const [rubberBandVisible, setRubberBandVisible] = useState(false);

  // this supose to replace old shouldComponentUpdate , not sure we need it
  useEffect(() => {
    console.log('Component Updated'); // eslint-disable-line no-console
  }, [filterOptions, queue.queue, sampleList, order]); // Dependencies

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
    const selected = getSamplesList()
      .filter((sampleItem) => {
        // `sampleItem.key` may include a column (:), so we can't use `querySelector`
        // eslint-disable-next-line unicorn/prefer-query-selector
        const sampleElement = document.getElementById(sampleItem.key);
        return checkForOverlap(selectionRubberBand, sampleElement);
      })
      .map((sampleItem) => sampleItem.key);

    selectionRubberBand.style.display = 'none';
    setRubberBandVisible(false);

    // If several samples selected call the handler, otherwise rely on
    // onClick handler to handle the click
    if (selected.length > 0) {
      sampleGridItemsSelectedHandler(e, selected);
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

  /**
   * Select Items in a cell for collect
   */
  function pickAllCellPuckItemsOnClick(e, sampleItem, pickSample) {
    if (pickSample) {
      addSamplesToQueue(sampleItem);
    } else {
      inQueueDeleteElseAddSamples(sampleItem, false);
    }
    e.stopPropagation();
  }

  const getSampleListFilteredByCellPuck = useCallback(
    (cellID, puckID) => {
      if (!cellID) {
        return [[], [], ''];
      }

      const filterSamples = (filterFn) =>
        Object.values(sampleList)
          .filter(filterFn)
          .map((sample) => ({
            sample,
            sampleID: sample.sampleID,
            inQueue: inQueue(sample.sampleID),
          }));

      if (puckID === null) {
        const filteredSamples = filterSamples(
          (s) => s.cell_no === cellID,
        ).filter((sample) => filterSampleByKey(sample.sampleID));

        const allCellSample = filteredSamples.map(({ sampleID }) => sampleID);
        const allCellSampleCheck = filteredSamples
          .filter(({ inQueue }) => inQueue)
          .map(({ sampleID }) => sampleID);

        return [allCellSample, allCellSampleCheck];
      }

      const filteredSamples = filterSamples(
        (s) => s.cell_no === Number(cellID) && s.puck_no === Number(puckID),
      );

      const allPuckSamplesID = filteredSamples
        .filter((sample) => filterSampleByKey(sample.sampleID))
        .map(({ sampleID }) => sampleID);

      const allPuckSampleCheck = filteredSamples
        .filter((sample) => filterSampleByKey(sample.sampleID))
        .filter(({ inQueue }) => inQueue)
        .map(({ sampleID }) => sampleID);

      const puck_code =
        filteredSamples.length > 0 && filteredSamples[0].sample.containerCode
          ? `| Code : ${filteredSamples[0].sample.containerCode}`
          : '';

      return [allPuckSamplesID, allPuckSampleCheck, puck_code];
    },
    [sampleList, inQueue, filterSampleByKey],
  );

  function displayContextMenu(e, contextMenuID, sampleID) {
    e.preventDefault();
    setRubberBandVisible(false);
    if (queue.queueStatus !== QUEUE_RUNNING) {
      dispatch(showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY));
    }
    selectItemUnderCursor(e, sampleID);
  }

  function displayPuckCellContextMenu(e, contextMenuID, cellID, puckID) {
    e.preventDefault();
    if (queue.queueStatus !== QUEUE_RUNNING) {
      dispatch(showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY));
    }

    const selectedList = getSampleListFilteredByCellPuck(cellID, puckID)[0];
    // Apply Selection
    sampleGridItemsSelectedHandler(e, selectedList);
    e.stopPropagation();
  }

  function isSingleCell() {
    return Object.values(sampleList).every(
      (sample) => sample.cell_no === 1 || sample.cell_no === 0,
    );
  }

  function getSampleItemCollapsibleHeaderActions(cellID) {
    const sampleListFiltered = getSampleListFilteredByCellPuck(cellID, null);
    return (
      <div className="sample-items-collapsible-header-actions">
        <b className="me-2 mt-1">{isSingleCell() ? null : `Cell ${cellID}`}</b>
        <SampleItemsControls
          sampleListFiltered={sampleListFiltered}
          puck={null}
          OnClickHandler={pickAllCellPuckItemsOnClick}
        />
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
   * for both single-cell and multi-cell cases
   *
   * @property {Object} sampleList
   * @property {array} order
   * @property {array} queue
   * @property {object} selected
   *
   * return {array} array of SampleItems
   */
  function getSampleItems(
    cellID,
    puckID,
    sampleNumber = null,
    isSingleCell = false,
  ) {
    const filteredSamples = Object.values(sampleList).filter((sample) =>
      isSingleCell
        ? sample.location === `${puckID}:${sampleNumber}`
        : sample.cell_no === Number(cellID) &&
          sample.puck_no === Number(puckID),
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
              'samples-grid-table-li-manual': Number(cellID) === 0,
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

  function getPuckList(scContent, filterOptions, cellID, isSingleCell) {
    const puckFilterValue = Number(filterOptions.puckFilter); // Ensure numeric comparison

    return scContent.children.filter((puck, puckidx) => {
      const puckID = isSingleCell ? Number(puck.name) : puckidx + 1;
      const filterList = getSampleListFilteredByCellPuck(cellID, puckID)[0];

      return (
        filterList.length > 0 &&
        (puckFilterValue === puckID || filterOptions.puckFilter === '')
      );
    });
  }

  // Render function for single cell mode
  function getSingleCellPucks(cell, cellID, puckList, colsmAfter) {
    return puckList.map((puck) => (
      <Col className="mt-2 p-2" sm={colsmAfter} key={`puck-${puck.name}`}>
        <SampleGridTable
          cell={cell}
          cellID={cellID}
          puckList={[puck]}
          isSingleCell
          sampleListFiltered={getSampleListFilteredByCellPuck}
          itemsControlsClickHandler={pickAllCellPuckItemsOnClick}
          displayContextMenuHandler={displayPuckCellContextMenu}
          sampleItems={getSampleItems}
        />
      </Col>
    ));
  }

  // render function for multiple cells mode
  function getMultipleCellPucks(cell, cellID, puckList, colsmAfter) {
    return (
      <Col className="p-1" sm={colsmAfter} key={`cell-${cellID}`}>
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
            <SampleGridTable
              cell={cell}
              cellID={cellID}
              puckList={puckList}
              isSingleCell={false}
              sampleListFiltered={getSampleListFilteredByCellPuck}
              itemsControlsClickHandler={pickAllCellPuckItemsOnClick}
              displayContextMenuHandler={displayPuckCellContextMenu}
              sampleItems={getSampleItems}
            />
          </Collapsible>
        </LazyLoad>
      </Col>
    );
  }

  function getSampleTable() {
    let scContent = sampleChanger?.contents;
    if (!scContent?.children) {
      return null;
    }

    const singleCell = isSingleCell();
    if (singleCell) {
      scContent = { children: [{ name: 1, children: scContent.children }] };
    }

    return scContent.children.map((cell) => {
      const cellID = Number(cell.name);
      const puckList = getPuckList(cell, filterOptions, cellID, singleCell);
      if (puckList.length === 0) {
        return null;
      }

      const colsmAfter = getColsm(singleCell, puckList.length);

      return singleCell
        ? getSingleCellPucks(cell, cellID, puckList, colsmAfter)
        : getMultipleCellPucks(cell, cellID, puckList, colsmAfter);
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
        <Dropdown.Item onClick={showDataCollectionForm}>
          Data collection
        </Dropdown.Item>
        <Dropdown.Item onClick={showCharacterisationForm}>
          Characterisation
        </Dropdown.Item>
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
      case 'samples-grid-table-context-menu': {
        menu = (
          <>
            {getSampleContextMenu()}
            {getTaskContextMenuItems()}
          </>
        );

        break;
      }
      case 'samples-grid-table-context-menu-mounted': {
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
    if (type.includes('CATS')) {
      return <SampleIsaraView />;
    } else if (type.includes('FLEX') || type.includes('Moc')) {
      return (
        <SampleFlexView
          displayPuckCellContextMenu={(e, menuID, cell, puck) =>
            displayPuckCellContextMenu(e, menuID, cell, puck)
          }
          cellMenuID={CELL_MENU_ID}
          puckMenuID={PUCK_MENU_ID}
          type={type}
        />
      );
    }
    return null;
  }

  if (
    !sampleChanger?.contents?.children ||
    Object.keys(sampleList).length === 0
  ) {
    return null;
  }

  return (
    <div>
      {contextMenu.show && (
        <MXContextMenu
          id={contextMenu.id}
          show={contextMenu.show}
          x={contextMenu.x}
          y={contextMenu.y}
          showGenericContextMenu={showGenericContextMenu}
        >
          {getContextMenu(contextMenu.id)}
        </MXContextMenu>
      )}
      {viewMode.mode === 'Graphical View' ? (
        <Row
          className="samples-grid-table pe-2"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          xs="auto"
        >
          <div className="selection-rubber-band" id="selectionRubberBand" />
          <ManualSamples getSampleItems={getSampleItems} />
          {getSampleListAsDrawing()}
          {getSampleTable()}
          {/* <CollapseHorizontal> */}
          {/* {getSampleTable()} */}
          {/* </CollapseHorizontal> */}
        </Row>
      ) : (
        <Row
          className="samples-grid-table"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          xs="auto"
        >
          <div className="selection-rubber-band" id="selectionRubberBand" />
          <ManualSamples getSampleItems={getSampleItems} />
          {getSampleTable()}
        </Row>
      )}
    </div>
  );
}
