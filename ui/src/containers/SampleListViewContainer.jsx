import { useCallback, useEffect } from 'react';
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  InputGroup,
  Row,
} from 'react-bootstrap';
import { LuSettings2 } from 'react-icons/lu';
import { MdGridView } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { showConfirmClearQueueDialog } from '../actions/general';
import {
  addSamplesToQueue,
  deleteSamplesFromQueue,
  deleteTaskList,
  setEnabledSample,
  stopQueue,
} from '../actions/queue';
import { showConfirmCollectDialog } from '../actions/queueGUI';
import {
  filterAction,
  getLimsSamples,
  getSamplesList,
  selectSamplesAction,
  setViewModeAction,
  showGenericContextMenu,
} from '../actions/sampleGrid';
import { showTaskForm } from '../actions/taskForm';
import TooltipTrigger from '../components/TooltipTrigger';
import { isCollected, QUEUE_RUNNING } from '../constants';
import loader from '../img/loader.gif';
import QueueSettings from './QueueSettings';
import SampleGridTableContainer from './SampleGridTableContainer';

export default function SampleListViewContainer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const loginData = useSelector((state) => state.login);
  const queue = useSelector((state) => state.queue);
  const loading = useSelector((state) => state.queueGUI.loading);
  const selected = useSelector((state) => state.sampleGrid.selected);
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const viewMode = useSelector((state) => state.sampleGrid.viewMode);
  const defaultParameters = useSelector(
    (state) => state.taskForm.defaultParameters,
  );
  const filterOptions = useSelector((state) => state.sampleGrid.filterOptions);
  const sampleChanger = useSelector((state) => state.sampleChanger);
  const sampleChangerType = useSelector((state) =>
    state.sampleChanger.contents ? state.sampleChanger.contents.name : 'Mockup',
  );

  const showGetSamplesFromSC = useSelector(
    (state) => state.general.useGetSamplesFromSC,
  );

  const handleSetViewMode = useCallback(
    (mode) => {
      if (sampleChangerType.includes('FLEX') && mode.includes('Graphical')) {
        dispatch(filterAction({ cellFilter: '1' }));
      } else {
        dispatch(filterAction({ cellFilter: '' }));
      }

      localStorage.setItem('view-mode', mode);
      dispatch(setViewModeAction(mode));
    },
    [dispatch, sampleChangerType],
  );

  useEffect(() => {
    const localStorageViewMode = localStorage.getItem('view-mode');
    handleSetViewMode(localStorageViewMode || viewMode.mode);
  }, [handleSetViewMode, viewMode.mode]);

  function showCharacterisationForm() {
    displayTaskForm('Characterisation', {});
  }

  function showDataCollectionForm() {
    displayTaskForm('DataCollection', {});
  }

  function showAddSampleForm() {
    displayTaskForm('AddSample');
  }

  function showWorkflowForm(wf) {
    displayTaskForm('Workflow', wf);
  }

  function getCellFilterOptions() {
    let options = [];

    const sampleListByCellNb = Object.values(sampleList).map(
      (sample) => sample.cell_no,
    );
    // we create a list from all cell numbers and keep unique value and then sort ascending
    const sampleListByCellNbUniqueVal = [...new Set(sampleListByCellNb)].sort(
      (va, vb) => va - vb,
    );

    if (sampleList) {
      options = sampleListByCellNbUniqueVal.map((cell) => (
        <option key={`filter-cell-${cell}`} value={cell}>
          {cell}
        </option>
      ));
    }

    if (viewMode.mode !== 'Graphical View') {
      options.push(
        <option key="all" value="">
          ALL
        </option>,
      );
    }

    return options;
  }

  function getPuckFilterOptions() {
    let options = [];

    const sampleListByPuckNb = Object.values(sampleList).map(
      (sample) => sample.puck_no,
    );
    // we create a list from all puck numbers and keep unique value and then sort ascending
    const sampleListByPuckNbUniqueVal = [...new Set(sampleListByPuckNb)].sort(
      (va, vb) => va - vb,
    );

    if (sampleList) {
      options = sampleListByPuckNbUniqueVal.map((puck) => (
        <option key={`filter-puck-${puck}`} value={puck}>
          {puck}
        </option>
      ));
    }
    options.push(
      <option key="all" value="">
        ALL
      </option>,
    );

    return options;
  }

  /**
   * Helper function that displays a task form
   *
   * @param {string} formName - [Characterisation, DataCollection, AddSample]
   * @property {Object} selected - List of selected Samples
   * @property {Object} sampleList - Samples List
   */
  function displayTaskForm(formName, extraParams = {}) {
    let prefix = '';
    const path = '';
    let subdir = `${queue.groupFolder}`;

    if (formName === 'AddSample') {
      dispatch(showTaskForm('AddSample'));
    } else {
      if (Object.keys(selected).length === 1) {
        prefix = sampleList[Object.keys(selected)[0]].defaultPrefix;
        subdir += sampleList[Object.keys(selected)[0]].defaultSubDir;
      } else {
        let type =
          formName === 'Generic' ? extraParams.type : formName.toLowerCase();
        type = formName === 'Workflow' ? 'datacollection' : type;

        prefix = defaultParameters[type].acq_parameters.prefixTemplate;
        subdir += defaultParameters[type].acq_parameters.subDirTemplate;
      }

      const type =
        formName === 'Generic' ? extraParams.type : formName.toLowerCase();
      const params =
        formName !== 'Workflow'
          ? defaultParameters[type].acq_parameters
          : defaultParameters.datacollection.acq_parameters;

      const parameters = {
        parameters: {
          ...params,
          ...extraParams,
          prefix,
          path,
          subdir,
          shape: -1,
        },
        type,
      };

      const newselected = [];

      for (const sampleID in selected) {
        if (selected[sampleID]) {
          newselected.push(sampleID);
        }
      }

      if (formName === 'AddSample') {
        dispatch(showTaskForm('AddSample'));
      } else {
        dispatch(
          showTaskForm(formName, newselected, parameters, -1, 'samplelist'),
        );
      }
    }
  }

  /**
   * Fetches samples from the SampleChanger
   */
  function getSamplesFromSC() {
    dispatch(getSamplesList());
  }

  /**
   * Synchronises samples with LIMS
   * @param {string} lims - LIMS name to synchronise with
   */
  function handleGetLimsSamples(lims) {
    dispatch(getLimsSamples(lims));
  }

  /**
   * Helper function for filter that takes a sample object instead of sampleID
   *
   * @param {object} sample
   * return {boolean} true if sample is in queue otherwise false
   */
  function inQueueSampleID(sample) {
    return inQueue(sample.sampleID);
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
  function mutualExclusiveFilterOption(sample, o1, o2, testFun) {
    let includeItem = false;

    // First case is included for clarity since the two options
    // cancel each other out. Dont do anything same as both false. Otherwise
    // apply filter.

    if (filterOptions[o1] && filterOptions[o2]) {
      includeItem = true;
    } else if (!filterOptions[o1] && !filterOptions[o2]) {
      includeItem = true;
    } else if (filterOptions[o1]) {
      includeItem = testFun(sample);
    } else if (filterOptions[o2]) {
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
  function applyFilter(key, cellID = null, puckID = null) {
    const { cellFilter, puckFilter } = filterOptions;

    // we either use the store value or  Pass the intended filter parameters manually
    const cellNo = cellID ?? Number(cellFilter);
    const puckNo = puckID ?? Number(puckFilter);

    const sample = sampleList[key];
    let fi = false;
    if (sample) {
      const sampleFilter =
        `${sample.sampleName} ${sample.proteinAcronym}`.toLowerCase();

      fi = sampleFilter.includes(filterOptions.text.toLowerCase());

      // eslint-disable-next-line no-bitwise
      fi &= mutualExclusiveFilterOption(
        sample,
        'inQueue',
        'notInQueue',
        inQueueSampleID,
      );
      // eslint-disable-next-line no-bitwise
      fi &= mutualExclusiveFilterOption(
        sample,
        'collected',
        'notCollected',
        isCollected,
      );
      if (cellFilter !== '') {
        // eslint-disable-next-line no-bitwise
        fi &= sample.cell_no === cellNo;
      }
      if (puckFilter !== '' && puckID !== null) {
        // eslint-disable-next-line no-bitwise
        fi &= sample.puck_no === puckNo;
      }
    }

    return fi;
  }

  /**
   * @return {boolean} true if any filter option is used
   */
  function filterIsUsed() {
    return (
      filterOptions.inQueue ||
      filterOptions.notInQueue ||
      filterOptions.collected ||
      filterOptions.notCollected ||
      filterOptions.text.length > 0 ||
      filterOptions.cellFilter !== '' ||
      filterOptions.puckFilter !== ''
    );
  }

  /**
   * Applies filter defined by user
   */
  function sampleGridFilter(e) {
    let filterValue = e.target.value.trim();
    if (e.target.type === 'checkbox') {
      filterValue = e.target.checked;
    }

    dispatch(filterAction({ [e.target.id]: filterValue }));

    if (Number(e.target.value) > 2) {
      window.scroll({
        top: 1,
        left: 0,
        behavior: 'smooth',
      });
    }
  }

  /**
   *  Clears the filter
   */
  function sampleGridClearFilter() {
    dispatch(
      filterAction({
        inQueue: false,
        notInQueue: false,
        collected: false,
        notCollected: false,
        text: '',
        cellFilter: '',
        puckFilter: '',
      }),
    );
  }

  /**
   * @return {number} number of sammples in queue
   */
  function numSamplesPicked() {
    const samples = [];

    queue.queue.forEach((sampleID) => {
      if (inQueue(sampleID)) {
        samples.push(sampleID);
      }
    });

    return samples.length;
  }

  /**
   * @return {boolean} true if collect should be disabled otherwise false
   */
  function isCollectDisabled() {
    return numSamplesPicked() === 0;
  }

  /**
   * Checks if sample with sampleID is in queue
   *
   * @param {string} sampleID
   * @property {Object} queue
   * @return {boolean} true if sample with sampleID is in queue otherwise false
   */
  function inQueue(sampleID) {
    return queue.queue.includes(sampleID) && sampleList[sampleID]?.checked;
  }

  /**
   * Adds samples with sampleIDs in sampleIDList, removes the samples if they
   * are already in the queue.
   *
   * @param {array} sampleIDList - array of sampleIDs to add or remove
   */
  function inQueueDeleteElseAddSamples(sampleIDList, addSamples) {
    const samples = [];
    const samplesToRemove = [];
    for (const sampleID of sampleIDList) {
      if (inQueue(sampleID)) {
        // Do not remove currently mounted sample
        if (queue.currentSampleID !== sampleID) {
          samplesToRemove.push(sampleID);
        }
      } else {
        samples.push(sampleID);
      }
    }

    if (samplesToRemove.length > 0) {
      dispatch(setEnabledSample(samplesToRemove, false));
    }
    if (addSamples && samples.length > 0) {
      handleAddSamplesToQueue(samples);
    }
  }

  /**
   * Removes selected samples from queue
   */
  function removeSelectedSamples() {
    const samplesToRemove = [];
    for (const sampleID of Object.keys(selected)) {
      if (
        inQueue(sampleID) &&
        sampleID !== sampleChanger.loadedSample.address
      ) {
        samplesToRemove.push(sampleID);
      }
    }
    dispatch(setEnabledSample(samplesToRemove, false));
  }

  /**
   * Removes samples from queue
   */
  function removeSamplesFromQueue(samplesList) {
    const samplesToRemove = [];
    for (const sampleID of samplesList) {
      if (
        inQueue(sampleID) &&
        sampleID !== sampleChanger.loadedSample.address
      ) {
        samplesToRemove.push(sampleID);
      }
    }

    dispatch(deleteSamplesFromQueue(samplesToRemove));
  }

  /**
   * Removes all tasks of selected samples
   */
  function removeSelectedTasks() {
    const selectedSamplesID = Object.keys(selected);
    dispatch(deleteTaskList(selectedSamplesID));
  }

  /**
   * @returns {number} total number of samples
   */
  function numSamples() {
    return Object.keys(sampleList).length;
  }

  function displayContextMenu(e, contextMenuID) {
    if (queue.queueStatus !== QUEUE_RUNNING) {
      dispatch(showGenericContextMenu(true, contextMenuID, e.pageX, e.pageY));
    }

    const samplesListKeys = Object.keys(sampleList).filter((key) =>
      applyFilter(key),
    );

    dispatch(selectSamplesAction(samplesListKeys));
    e.stopPropagation();
  }

  /**
   * Adds samples in sampleIDList to queue
   *
   * @param {array} sampleIDList - array of sampleIDs to add
   */
  function handleAddSamplesToQueue(sampleIDList) {
    const samplesToAdd = sampleIDList.map((sampleID) => {
      return { ...sampleList[sampleID], checked: true, tasks: [] };
    });
    if (samplesToAdd.length > 0) {
      dispatch(addSamplesToQueue(samplesToAdd));
    }
  }

  /**
   * Adds all selected samples to queue
   */
  function addSelectedSamplesToQueue() {
    handleAddSamplesToQueue(Object.keys(selected));
  }

  /**
   * Start collection
   */
  function startCollect() {
    navigate('/datacollection', { replace: true });
    dispatch(showConfirmCollectDialog());
  }

  function getSynchronizationDropDownList() {
    return (
      <Dropdown as={ButtonGroup}>
        <TooltipTrigger
          id="sync-samples-tooltip"
          tooltipContent={`Synchronise sample list with ${loginData.limsName[0]?.name},
          and apply filter to only show with LIMS samples`}
        >
          <Button
            variant="outline-secondary"
            className="nowrap-style"
            onClick={() => handleGetLimsSamples(loginData.limsName[0].name)}
          >
            <i className="fas fa-sync-alt" style={{ marginRight: '0.5em' }} />
            Get samples from {loginData.limsName[0].name}
          </Button>
        </TooltipTrigger>
        {/* Show the dropdown toggle only if there are multiple LIMS
        or if the option to get samples from SC is enabled */}
        {(loginData.limsName.length > 1 || showGetSamplesFromSC) && (
          <Dropdown.Toggle
            split
            variant="outline-secondary"
            id="dropdown-split-samples"
            title="Other LIMS Options"
          />
        )}

        <Dropdown.Menu>
          {showGetSamplesFromSC && (
            <TooltipTrigger tooltipContent="get samples from sample changer">
              <Dropdown.Item
                onClick={getSamplesFromSC}
                variant="outline-secondary"
                className="nowrap-style"
              >
                Get samples from SC
              </Dropdown.Item>
            </TooltipTrigger>
          )}
          {/* Skip the first LIMS as it is already included in the button above */}
          {loginData.limsName.slice(1).map((lims, _) => (
            <TooltipTrigger
              key={`sync-samples-${lims.name}`}
              id={`sync-samples-${lims.name}`}
              tooltipContent={`Synchronise sample list with ${lims.name}`}
            >
              <Dropdown.Item onClick={() => handleGetLimsSamples(lims.name)}>
                Get samples from {lims.name}
              </Dropdown.Item>
            </TooltipTrigger>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  /**
   * Collect button markup
   */
  function getCollectButton() {
    const collectText = `Collect ${numSamplesPicked()}/${numSamples()}`;

    let button = (
      <Button
        variant="success"
        onClick={() => startCollect()}
        disabled={isCollectDisabled()}
        style={{ whiteSpace: 'nowrap' }}
      >
        {collectText}
        <i className="fas fa-chevron-right ms-1" />
      </Button>
    );

    if (queue.queueStatus === QUEUE_RUNNING) {
      button = (
        <Button
          variant="danger"
          onClick={() => dispatch(stopQueue())}
          style={{ marginLeft: '1em' }}
        >
          <b> Stop queue </b>
        </Button>
      );
    }

    return button;
  }

  function innerSearchIcon() {
    return (
      <DropdownButton
        variant="outline-secondary"
        id="filter-drop-down"
        title="Filter options"
      >
        <div style={{ padding: '1em 1em 0 1em', width: '350px' }}>
          <b>
            Filter <i className="fas fa-filter" />{' '}
          </b>
          <hr />
          <Form.Group as={Row} size="small">
            <Form.Label column sm="3">
              {' '}
              Cell &nbsp;
            </Form.Label>
            <Form.Label column sm="1">
              {' '}
              : &nbsp;
            </Form.Label>
            <Col sm="6">
              <Form.Select
                id="cellFilter"
                value={filterOptions.cellFilter}
                onChange={sampleGridFilter}
              >
                {getCellFilterOptions()}
              </Form.Select>
            </Col>
          </Form.Group>
          <Form.Group as={Row} size="small">
            <Form.Label column sm="3">
              {' '}
              Puck &nbsp;
            </Form.Label>
            <Form.Label column sm="1">
              {' '}
              : &nbsp;
            </Form.Label>
            <Col sm="6">
              <Form.Select
                id="puckFilter"
                value={filterOptions.puckFilter}
                onChange={sampleGridFilter}
              >
                {getPuckFilterOptions()}
              </Form.Select>
            </Col>
          </Form.Group>
          <Row className="mb-2">
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                id="inQueue"
                inline
                checked={filterOptions.inQueue}
                onChange={sampleGridFilter}
                label="In Queue"
              />
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                inline
                id="notInQueue"
                checked={filterOptions.notInQueue}
                onChange={sampleGridFilter}
                label="Not in Queue"
              />
            </Col>
          </Row>
          <Row className="mb-2">
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                inline
                id="collected"
                checked={filterOptions.collected}
                onChange={sampleGridFilter}
                label="Collected"
              />
            </Col>
            <Col xs={6}>
              <Form.Check
                type="checkbox"
                inline
                id="notCollected"
                checked={filterOptions.notCollected}
                onChange={() => sampleGridFilter()}
                label="Not Collected"
              />
            </Col>
          </Row>
          <Row className="mt-3">
            <Col>
              <Button
                variant="outline-secondary"
                style={{ float: 'right' }}
                onClick={() => sampleGridClearFilter()}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </div>
      </DropdownButton>
    );
  }

  return (
    <Container
      fluid
      id="sampleGridContainer"
      className="samples-grid-table-container mt-4"
    >
      {loading ? (
        <div
          className="center-in-box"
          style={{ zIndex: 1200, position: 'fixed' }}
        >
          <img
            src={loader}
            className="img-centerd img-fluid"
            width="150"
            alt=""
          />
        </div>
      ) : null}
      <Card className="samples-grid-table-card">
        <Card.Header className="samples-grid-table-card-header">
          <Row className="gap-2">
            <Col className="d-flex">
              {getSynchronizationDropDownList()}
              <span style={{ marginLeft: '1.5em' }} />
              <Button
                className="nowrap-style"
                variant="outline-secondary"
                onClick={() => showAddSampleForm()}
              >
                <i className="fas fa-plus" style={{ marginRight: '0.5em' }} />
                Create new sample
              </Button>
              <span style={{ marginLeft: '1.5em' }} />
              <TooltipTrigger
                id="clear-samples-tooltip"
                tooltipContent="Remove all samples from sample list and queue"
              >
                <Button
                  className="nowrap-style"
                  variant="outline-secondary"
                  onClick={() => dispatch(showConfirmClearQueueDialog())}
                  disabled={
                    queue.queueStatus === QUEUE_RUNNING ||
                    Object.keys(sampleList).length === 0
                  }
                >
                  <i className="fas fa-trash-alt me-1" />
                  Clear sample list
                </Button>
              </TooltipTrigger>
              <span style={{ marginLeft: '1.5em' }} />
              <Dropdown>
                <TooltipTrigger
                  id="sync-samples-tooltip"
                  tooltipContent="Change Samples List View Mode from Graphical to Table and vice versa"
                >
                  <Dropdown.Toggle
                    variant="outline-secondary"
                    id="dropdown-basic"
                  >
                    <MdGridView size="1em" /> {viewMode.mode}
                  </Dropdown.Toggle>
                </TooltipTrigger>
                <Dropdown.Menu>
                  {viewMode.options.map((option) => (
                    <Dropdown.Item
                      key={option}
                      onClick={() => handleSetViewMode(option)}
                    >
                      {option}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Col>
            <Col className="d-flex me-auto">
              <Form onSubmit={(evt) => evt.preventDefault()}>
                <Form.Group as={Row} className="d-flex">
                  <Form.Label
                    style={{ whiteSpace: 'nowrap' }}
                    className="d-flex"
                    column
                    sm="2"
                  >
                    Filter :
                  </Form.Label>
                  <Col sm="9">
                    <InputGroup
                      className={filterIsUsed() ? 'filter-input-active' : ''}
                    >
                      <Form.Control
                        style={{ borderColor: '#CCC' }}
                        id="text"
                        type="text"
                        value={filterOptions.text}
                        onChange={sampleGridFilter}
                      />
                      {innerSearchIcon()}
                    </InputGroup>
                  </Col>
                </Form.Group>
              </Form>
              <span style={{ marginLeft: '1.5em' }} />
              <Button
                variant="outline-secondary"
                className="nowrap-style"
                title="Context Menu to Add DC or Workflow to all filtered Samples Options"
                disabled={Object.keys(sampleList).length === 0}
                onClick={(e) => {
                  displayContextMenu(e, 'samples-grid-table-context-menu-cell');
                }}
              >
                Add Task to Samples <LuSettings2 />
              </Button>
            </Col>
            <Col className="d-flex justify-content-end">
              <span style={{ marginLeft: '1em' }} />
              <QueueSettings />
              <span style={{ marginLeft: '1em' }} />
              {getCollectButton()}
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="samples-grid-table-card-body">
          <SampleGridTableContainer
            addSelectedSamplesToQueue={addSelectedSamplesToQueue}
            addSamplesToQueue={handleAddSamplesToQueue}
            showCharacterisationForm={showCharacterisationForm}
            showDataCollectionForm={showDataCollectionForm}
            showWorkflowForm={showWorkflowForm}
            inQueue={inQueue}
            inQueueDeleteElseAddSamples={inQueueDeleteElseAddSamples}
            removeSamplesFromQueue={removeSamplesFromQueue}
            removeSelectedSamples={removeSelectedSamples}
            removeSelectedTasks={removeSelectedTasks}
            filterSampleByKey={applyFilter}
            type={sampleChangerType}
          />
        </Card.Body>
      </Card>
    </Container>
  );
}
