import React, { useCallback, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { sendTakeSnapshot } from '../../api/sampleview';
import { download } from './utils';

import styles from './SampleControls.module.css';

const { fabric } = window;

function SnapshotControl(props) {
  const { canvas } = props;

  const proposal = useSelector((state) => state.login.selectedProposal);

  const currentSampleName = useSelector(({ queue, sampleGrid }) => {
    const { currentSampleID } = queue;
    return currentSampleID
      ? sampleGrid.sampleList[currentSampleID]?.sampleName
      : 'no-sample';
  });

  const imageRatio = useSelector((state) => {
    const { sourceScale, imageRatio } = state.sampleview;
    return sourceScale * imageRatio;
  });

  const takeSnapshot = useCallback(async () => {
    const img = document.querySelector('#sample-img');
    const fimg = new fabric.Image(img);
    fimg.scale(imageRatio);

    canvas.setBackgroundImage(fimg);
    canvas.renderAll();

    const imgDataURI = canvas.toDataURL({
      format: 'jpeg',
      backgroundColor: null,
    });

    canvas.setBackgroundImage(0);
    canvas.renderAll();

    const filename = `${proposal}-${currentSampleName}.jpeg`;
    const processedImgBlob = await sendTakeSnapshot(imgDataURI);
    download(
      filename,
      window.URL.createObjectURL(new Blob([processedImgBlob])),
    );
  }, [canvas, currentSampleName, imageRatio, proposal]);

  useEffect(() => {
    // Allow server to trigger snapshots (cf. `serverIO`)
    window.takeSnapshot = takeSnapshot;
  }, [takeSnapshot]);

  return (
    <Button
      className={styles.controlBtn}
      data-default-styles
      title="Take snapshot"
      onClick={() => takeSnapshot()}
    >
      <i className={`${styles.controlIcon} fas fa-camera`} />
      <span className={styles.controlLabel}>Snapshot</span>
    </Button>
  );
}

export default SnapshotControl;
