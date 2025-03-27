import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Col } from 'react-bootstrap';

export default function ManualSamples(props) {
  const { getSampleItems } = props;
  const sampleList = useSelector((state) => state.sampleGrid.sampleList);
  const manualSamples = useMemo(
    () =>
      Object.values(sampleList).filter(
        (sample) => sample.location === 'Manual',
      ),
    [sampleList],
  );

  if (manualSamples.length === 0) {
    return null;
  }

  const items = getSampleItems(0, 1);
  const numRows = Math.ceil(items.length / 6);

  const rows = Array.from({ length: numRows }, (_, i) =>
    items.slice(i * 6, i * 6 + 6),
  );

  return (
    <Col className="col-sm-12 mb-1">
      {items.length > 0 && <b className="me-2 mt-1">Manual Samples</b>}
      {rows.map((row, index) => (
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
