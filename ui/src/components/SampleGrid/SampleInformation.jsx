import ImageViewer from '../ImageViewer/ImageViewer';

export default function SampleInformation({ sampleData = {} }) {
  return (
    <div className="container-fluid" style={{ width: '700px' }}>
      <div className="row">
        <div className="col-md-6">
          <div className="row">
            <span className="col-sm-6">State :</span>
            <span className="col-sm-6">
              <strong>
                {sampleData?.container_info?.state?.replaceAll('_', ' ')}
              </strong>
            </span>
          </div>
          <div className="row">
            <span className="col-sm-6">Location :</span>
            <span className="col-sm-6">{sampleData.location}</span>
          </div>
          <div className="row">
            <span className="col-sm-6">Data matrix / ID :</span>
            <span className="col-sm-6">{sampleData.code}</span>
          </div>
          <div className="row">
            <span className="col-sm-6">Puck barcode :</span>
            <span className="col-sm-6">
              {sampleData?.container_info?.puck_barcode}
            </span>
          </div>
          <div className="row">
            <span className="col-sm-6">puck type :</span>
            <span className="col-sm-6">
              {sampleData?.container_info?.puck_type}
            </span>
          </div>
          <div className="row">
            <span className="col-sm-6">Sample barcode :</span>
            <span className="col-sm-6">
              {sampleData?.container_info?.sample_barcode}
            </span>
          </div>
          {sampleData.limsID && (
            <>
              <div className="row mt-3">
                <span className="col-sm-6">Space group :</span>
                <span className="col-sm-6">{sampleData.crystalSpaceGroup}</span>
              </div>
              <div className="row mt-3">
                <span className="col-sm-12">
                  <b>Crystal unit cell</b>
                </span>
              </div>
              <div className="row">
                <span className="col-sm-2">A :</span>
                <span className="col-sm-4">{sampleData.cellA}</span>
                <span className="col-sm-2">B :</span>
                <span className="col-sm-4">{sampleData.cellB}</span>
              </div>
              <div className="row">
                <span className="col-sm-2">C :</span>
                <span className="col-sm-4">{sampleData.cellC}</span>
                <span className="col-sm-2">α :</span>
                <span className="col-sm-4">{sampleData.cellAlpha}</span>
              </div>
              <div className="row">
                <span className="col-sm-2">β :</span>
                <span className="col-sm-4">{sampleData.cellBeta}</span>
                <span className="col-sm-2">γ :</span>
                <span className="col-sm-4">{sampleData.cellGamma}</span>
              </div>
            </>
          )}
        </div>
        <div className="col-md-6">
          {sampleData.image_url ? (
            <ImageViewer
              galleryView={false}
              imageUrl={sampleData.image_url}
              imageName={sampleData.sampleName || 'Sample Image'}
              imgAlt={sampleData.sampleName || 'Sample Image'}
              imgTargetX={sampleData.image_x}
              imgTargetY={sampleData.image_y}
              drawTarget={!!(sampleData.image_x && sampleData.image_y)}
            />
          ) : (
            <div className="text-center text-muted p-4 border rounded">
              <p>No image available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
