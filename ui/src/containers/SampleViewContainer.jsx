import { Col, Container, Row } from 'react-bootstrap';
import { connect, useDispatch } from 'react-redux';

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

function SampleViewContainer(props) {
  const {
    uiproperties,
    currentSampleID,
    shapes = {},
    mode,
    sampleList,
    defaultParameters,
    groupFolder,
    hardwareObjects,
    sampleChangerContents,
  } = props;

  const dispatch = useDispatch();

  function getControlAvailability(name) {
    const available = uiproperties.sample_view_video_controls.components.find(
      (component) => component.id === name && component.show === true,
    );

    return available?.show || false;
  }

  if (!('sample_view_motors' in uiproperties)) {
    return null;
  }

  const phase_control = uiproperties.sample_view?.components?.find(
    (c) => c.attribute === 'phase_control',
  );
  const beam_size = uiproperties?.sample_view?.components.find(
    (c) => c.attribute === 'beam_size',
  );

  const points = Object.fromEntries(
    Object.entries(shapes).filter(([_, shape]) => shape.t === 'P'),
  );
  const twoDPoints = Object.fromEntries(
    Object.entries(shapes).filter(([_, shape]) => shape.t === '2DP'),
  );
  const lines = Object.fromEntries(
    Object.entries(shapes).filter(([_, shape]) => shape.t === 'L'),
  );
  const grids = Object.fromEntries(
    Object.entries(shapes).filter(([_, shape]) => shape.t === 'G'),
  );
  const selectedGrids = Object.values(grids).filter((s) => s.selected);

  return (
    <Container fluid>
      <Row
        style={{
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
      <Row className="gx-3 mt-2 pt-1">
        <Col sm={2} xxl={1} className={styles.controllers}>
          <DefaultErrorBoundary>
            {phase_control !== undefined && (
              <div className={motorInputStyles.container}>
                <label className={motorInputStyles.label} htmlFor="PhaseInput">
                  {phase_control.label}
                </label>
                <PhaseInput />
              </div>
            )}
            {beam_size !== undefined && (
              <div className={motorInputStyles.container}>
                <label
                  className={motorInputStyles.label}
                  htmlFor="ApertureInput"
                >
                  {beam_size.label}
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
            <ContextMenu getControlAvailability={getControlAvailability} />
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

function mapStateToProps(state) {
  return {
    sampleList: state.sampleGrid.sampleList,
    currentSampleID: state.queue.currentSampleID,
    groupFolder: state.queue.groupFolder,
    hardwareObjects: state.beamline.hardwareObjects,
    defaultParameters: state.taskForm.defaultParameters,
    shapes: state.shapes.shapes,
    remoteAccess: state.remoteAccess,
    uiproperties: state.uiproperties,
    mode: state.general.mode,
    sampleChangerContents: state.sampleChanger.contents,
  };
}

export default connect(mapStateToProps)(SampleViewContainer);
