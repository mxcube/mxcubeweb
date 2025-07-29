export function DataCollectionResultSummary(props) {
  const { taskData } = props;
  if (!taskData?.parameters) {
    return <div>No data available</div>;
  }
  const {
    fullPath,
    osc_range,
    first_image,
    osc_start,
    num_images,
    exp_time,
    transmission,
    energy,
    resolution,
  } = taskData.parameters;

  return (
    <div className="row">
      <span className="col-sm-12 mb-2">
        <b>Path: {fullPath}</b>
      </span>
      <span className="col-sm-3">Oscillation range:</span>
      <span className="col-sm-3">{osc_range}&deg;</span>
      <span className="col-sm-3">First image</span>
      <span className="col-sm-3">{first_image}</span>

      <span className="col-sm-3">Oscillation start:</span>
      <span className="col-sm-3">{osc_start}&deg;</span>
      <span className="col-sm-3">Number of images</span>
      <span className="col-sm-3">{num_images}</span>

      <span className="col-sm-3">Exposure time:</span>
      <span className="col-sm-3">{`${exp_time}s`}</span>
      <span className="col-sm-3">Transmission</span>
      <span className="col-sm-3">{`${transmission} %`}</span>

      <span className="col-sm-3">Energy:</span>
      <span className="col-sm-3">{`${energy} keV`}</span>
      <span className="col-sm-3">Resolution</span>
      <span className="col-sm-3">{`${resolution} Å`}</span>
    </div>
  );
}
