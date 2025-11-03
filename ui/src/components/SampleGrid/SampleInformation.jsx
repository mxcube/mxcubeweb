export default function SampleInformation({ sampleData = {} }) {
  return (
    <div>
      <div className="row">
        <span className="col-sm-6">Location:</span>
        <span className="col-sm-6">{sampleData.location}</span>
        <span className="col-sm-6">Data matrix / ID:</span>
        <span className="col-sm-6">{sampleData.code}</span>
        <span className="col-sm-6">State in Container:</span>
        <span className="col-sm-6">{sampleData?.container_info?.state}</span>
      </div>
      {sampleData.limsID && (
        <div>
          <div className="row">
            <span className="col-sm-6">Space group:</span>
            <span className="col-sm-6">{sampleData.crystalSpaceGroup}</span>
          </div>
          <div className="row">
            <span style={{ paddingTop: '0.5em' }} className="col-sm-12">
              <b>Crystal unit cell:</b>
            </span>
            <span className="col-sm-1">A:</span>
            <span className="col-sm-2">{sampleData.cellA}</span>
            <span className="col-sm-1">B:</span>
            <span className="col-sm-2">{sampleData.cellB}</span>
            <span className="col-sm-1">C:</span>
            <span className="col-sm-2">{sampleData.cellC}</span>
          </div>
          <div className="row">
            <span className="col-sm-1">&alpha;:</span>
            <span className="col-sm-2">{sampleData.cellAlpha}</span>
            <span className="col-sm-1">&beta;:</span>
            <span className="col-sm-2">{sampleData.cellBeta}</span>
            <span className="col-sm-1">&gamma;:</span>
            <span className="col-sm-2">{sampleData.cellGamma}</span>
          </div>
        </div>
      )}
    </div>
  );
}
