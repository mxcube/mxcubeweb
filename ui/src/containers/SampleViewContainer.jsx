import { Col, Container, Row } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

import { executeCommand, setAttribute } from '../actions/beamline';
import { addShape } from '../actions/sampleview';
import { showTaskForm } from '../actions/taskForm';
import PlateManipulator from '../components/Equipment/PlateManipulator';
import motorInputStyles from '../components/MotorInput/MotorInput.module.css';
import ApertureInput from '../components/SampleView/ApertureInput';
import ContextMenu from '../components/SampleView/ContextMenu';
import MotorControls from '../components/SampleView/MotorControls';
import PhaseInput from '../components/SampleView/PhaseInput';
import SampleImage from '../components/SampleView/SampleImage';
import SSXChipControl from '../components/SSXChip/SSXChipControl';
import BeamlineSetupContainer from './BeamlineSetupContainer';
import DefaultErrorBoundary from './DefaultErrorBoundary';
import SampleQueueContainer from './SampleQueueContainer';
import styles from './SampleViewContainer.module.css';

function getShapes(shapes, type) {
  return Object.fromEntries(
    Object.entries(shapes).filter(([_, shape]) => shape.t === type),
  );
}

function SampleViewContainer() {
  const dispatch = useDispatch();

  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const currentSampleID = useSelector((state) => state.queue.currentSampleID);
  const groupFolder = useSelector((state) => state.queue.groupFolder);
  const hardwareObjects = useSelector(
    (state) => state.beamline.hardwareObjects,
  );
  const defaultParameters = useSelector(
    (state) => state.taskForm.defaultParameters,
  );
  const shapes = useSelector((state) => state.shapes.shapes) || {};
  const uiproperties = useSelector((state) => state.uiproperties);
  const mode = useSelector((state) => state.general.mode);
  const sampleChangerContents = useSelector(
    (state) => state.sampleChanger.contents,
  );

  if (!('sample_view_motors' in uiproperties)) {
    return null;
  }

  const phaseControl = uiproperties.sample_view?.components?.find(
    (c) => c.attribute === 'phase_control',
  );
  const beamSize = uiproperties.sample_view?.components.find(
    (c) => c.attribute === 'beam_size',
  );

  const points = getShapes(shapes, 'P');
  const twoDPoints = getShapes(shapes, '2DP');
  const lines = getShapes(shapes, 'L');
  const grids = getShapes(shapes, 'G');
  const selectedGrids = Object.values(grids).filter((s) => s.selected);

  return (
    <Container className="d-flex flex-column" fluid>
      <Row
        style={{
          flex: 'none',
          background: '#fafafa',
          borderBottom: '1px solid lightgray',
          paddingBottom: '0em',
        }}
      >
        <Col sm={12}>
          <DefaultErrorBoundary>
            <BeamlineSetupContainer />
          </DefaultErrorBoundary>
        </Col>
      </Row>
      <Row className="flex-grow-1 gx-3 py-3">
        <Col sm={2} xxl={1} className={styles.controllers}>
          <DefaultErrorBoundary>
            {phaseControl !== undefined && (
              <div className={motorInputStyles.container}>
                <label className={motorInputStyles.label} htmlFor="PhaseInput">
                  {phaseControl.label}
                </label>
                <PhaseInput />
              </div>
            )}
            {beamSize !== undefined && (
              <div className={motorInputStyles.container}>
                <label
                  className={motorInputStyles.label}
                  htmlFor="ApertureInput"
                >
                  {beamSize.label}
                </label>
                <ApertureInput />
              </div>
            )}

            {mode === 'SSX-CHIP' && (
              <SSXChipControl
                showForm={(...args) => dispatch(showTaskForm(...args))}
                currentSampleID={currentSampleID}
                sampleData={sampleList[currentSampleID]}
                defaultParameters={defaultParameters}
                groupFolder={groupFolder}
                hardwareObjects={hardwareObjects}
                uiproperties={uiproperties.sample_view_motors}
                addShape={(...args) => dispatch(addShape(...args))}
                grids={grids}
                selectedGrids={selectedGrids}
                setAttribute={(...args) => dispatch(setAttribute(...args))}
                sendExecuteCommand={(...args) =>
                  dispatch(executeCommand(...args))
                }
              />
            )}
            {sampleChangerContents.name === 'PlateManipulator' && (
              <PlateManipulator inPopover />
            )}

            <MotorControls />
          </DefaultErrorBoundary>
        </Col>
        <Col sm={6}>
          <DefaultErrorBoundary>
            <ContextMenu />
            <SampleImage
              points={points}
              twoDPoints={twoDPoints}
              lines={lines}
              grids={grids}
              selectedGrids={selectedGrids}
            />
          </DefaultErrorBoundary>
        </Col>
        <Col
          sm={4}
          xxl={5}
          className={styles.queue}
          style={{ display: 'flex' }}
        >
          <DefaultErrorBoundary>
            <SampleQueueContainer />
          </DefaultErrorBoundary>
        </Col>
      </Row>
    </Container>
  );
}

export default SampleViewContainer;
