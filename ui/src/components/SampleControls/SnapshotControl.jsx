import { FabricImage } from 'fabric';
import { useCallback, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';

import { sendTakeSnapshot } from '../../api/sampleview';
import styles from './SampleControls.module.css';
import { download } from './utils';

function SnapshotControl(props) {
  const { canvas } = props;

  const proposal = useSelector((state) => state.login.selectedProposal);

  const currentSampleName = useSelector(({ queue, sampleGrid }) => {
    const { currentSampleID } = queue;
    return currentSampleID
      ? sampleGrid.sampleList[currentSampleID]?.sampleName
      : 'no-sample';
  });

  const ratio = useSelector((state) => {
    const { sourceScale, imageRatio } = state.sampleview;
    return sourceScale * imageRatio;
  });

  const takeSnapshot = useCallback(async () => {
    const img = document.querySelector('#sample-img');
    const fimg = new FabricImage(img, { originX: 'left', originY: 'top' });
    fimg.scale(ratio);

    const previousBG = canvas.backgroundImage;

    canvas.backgroundImage = fimg;
    canvas.requestRenderAll();

    const imgDataURI = canvas.toDataURL({
      format: 'jpeg',
      backgroundColor: null,
    });

    canvas.backgroundImage = previousBG;
    canvas.requestRenderAll();

    const filename = `${proposal}-${currentSampleName}.jpeg`;
    const processedImgBlob = await sendTakeSnapshot(imgDataURI);
    download(
      filename,
      globalThis.URL.createObjectURL(new Blob([processedImgBlob])),
    );
  }, [canvas, currentSampleName, ratio, proposal]);

  useEffect(() => {
    // Allow server to trigger snapshots (cf. `serverIO`)
    globalThis.takeSnapshot = takeSnapshot;
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
