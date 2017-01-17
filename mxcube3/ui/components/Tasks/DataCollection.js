import React from 'react';
import { reduxForm } from 'redux-form';
import { Modal, Button } from 'react-bootstrap';
import validate from './validate';
// import asyncValidate from './asyncValidate';
/* eslint camelcase: 0 */


class DataCollection extends React.Component {

  constructor(props) {
    super(props);
    this.runNow = this.handleSubmit.bind(this, true);
    this.addToQueue = this.handleSubmit.bind(this, false);
    this.inputCSS = this.inputCSS.bind(this);
    this.anyError = this.anyError.bind(this);
  }

  handleSubmit(runNow) {
    const parameters = {
      ...this.props.values,
      type: 'DataCollection',
      label: 'Data Collection',
      helical: false,
      point: this.props.pointID
    };
    // Form gives us all parameter values in strings so we need to transform numbers back
    const stringFields = [
      'shutterless',
      'inverse_beam',
      'centringMethod',
      'detector_mode',
      'space_group',
      'prefix',
      'path',
      'type',
      'point',
      'label',
      'helical'
    ];

    this.props.addTask(parameters, stringFields, runNow);
    this.props.hide();
  }

  inputCSS(field) {
    let className;
    if (this.props.fields[field].error) {
      className = 'form-control warning';
    } else {
      className = 'form-control';
    }
    return className;
  }

  anyError() {
    let err;
    if (Object.keys(this.props.errors).length === 0) {
      err = false;
    } else {
      err = true;
    }
    return err;
  }


  handleShowHide(e) {
    const node = e.target;
    if (node.innerHTML === 'Show More') {
      node.innerHTML = 'Show Less';
    } else {
      node.innerHTML = 'Show More';
    }
  }


  render() {
    const {
      fields: {
        num_images,
        first_image,
        exp_time,
        resolution,
        osc_start,
        energy,
        osc_range,
        transmission,
        shutterless,
        inverse_beam,
        centringMethod,
        detector_mode,
        kappa,
        kappa_phi,
        space_group,
        prefix,
        run_number,
        beam_size,
        path
      },
      rootPath
    } = this.props;
    return (
      <Modal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Standard Data Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <div className="task-title-head">
            <span className="task-title-body">
              Data location
            </span>
          </div>

          <form className="form-horizontal">

            <div className="form-group">
              <label className="col-sm-12 control-label">
                Path: {`${rootPath}/${path.value}`}
              </label>
            </div>

            <div className="form-group">
              <label className="col-sm-2 control-label">Subdirectory</label>
              <div className="col-sm-4">
                <input type="text" className="form-control" {...path} />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-12 control-label">
                Filename: { `${prefix.value}_${run_number.value}_xxxx.cbf`}
              </label>
            </div>

            <div className="form-group">
              <label className="col-sm-3 control-label">Prefix</label>
              <div className="col-sm-3">
                <input type="text" className="form-control" {...prefix} />
              </div>
              <label className="col-sm-3 control-label">Run number</label>
              <div className="col-sm-3">
                <input type="number" className="form-control" {...run_number} />
              </div>
            </div>

          </form>

          <div className="task-title-head">
            <span className="task-title-body">
              Acquisition
            </span>
          </div>

          <form className="form-horizontal">

            <div className="form-group">
              <label className="col-sm-3 control-label">Oscillation range</label>
              <div className="col-sm-3">
                <input type="number" className={this.inputCSS('osc_range')} {...osc_range} />
              </div>
              <label className="col-sm-3 control-label">First Image</label>
              <div className="col-sm-3">
                <input type="number" className="form-control" {...first_image} />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-3 control-label">Oscillation start</label>
              <div className="col-sm-3">
                  <input type="number" className={this.inputCSS('osc_start')} {...osc_start} />
              </div>
              <label className="col-sm-3 control-label">Number of images</label>
              <div className="col-sm-3">
                  <input type="number" className={this.inputCSS('num_images')} {...num_images} />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-3 control-label">Exposure time(s)</label>
              <div className="col-sm-3">
                  <input type="number" className={this.inputCSS('exp_time')} {...exp_time} />
              </div>
              <label className="col-sm-3 control-label">Transmission (%)</label>
              <div className="col-sm-3">
                  <input type="number" className="form-control" {...transmission} />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-3 control-label">Energy (KeV)</label>
              <div className="col-sm-3">
                  <input type="number" className={this.inputCSS('energy')} step="0.1" {...energy} />
              </div>
              <label className="col-sm-3 control-label">
                <input type="checkbox" />MAD
              </label>
              <div className="col-sm-3">
               <select className="form-control" >
                <option value="ip">ip:-</option>
                <option value="pk">pk:-</option>
              </select>
              </div>
            </div>

            <div className="form-group">
                <label className="col-sm-3 control-label">Resolution (Å)</label>
                <div className="col-sm-3">
                    <input
                      type="number"
                      className={this.inputCSS('resolution')}
                      step="0.1" {...resolution}
                    />
                </div>
            </div>

            <div className="collapse" id="acquistion">

              <div className="form-group">
                <label className="col-sm-3 control-label">Kappa</label>
                <div className="col-sm-3">
                  <input type="number" className="form-control" {...kappa} />
                </div>
                <label className="col-sm-3 control-label">Phi</label>
                <div className="col-sm-3">
                  <input type="number" className="form-control" {...kappa_phi} />
                </div>
              </div>

              <div className="form-group">
                <label className="col-sm-3 control-label">Beam size</label>
                <div className="col-sm-3">
                  <select className="form-control" {...beam_size}>
                    {this.props.apertureList.map((val, i) =>
                       (<option key={i} value={val}>{val}</option>)
                    )}
                  </select>
                </div>
                <label className="col-sm-3 control-label">Subwedge size</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" />
                </div>
              </div>

              <div className="form-group">
                <label className="col-sm-3 control-label">Detector mode</label>
                <div className="col-sm-3">
                 <select className="form-control" {...detector_mode}>
                  <option value="0">0</option>
                  <option value="C18">C18</option>
                  <option value="C2">C2</option>
                </select>
                </div>
                <label className="col-sm-3 control-label">
                  <input type="checkbox" {...shutterless} />
                  Shutterless
                </label>
                <label className="col-sm-3 control-label">
                  <input type="checkbox" {...inverse_beam} />
                  Inverse beam
                </label>
              </div>

            </div>
            <p className="text-right">
              <a
                data-toggle="collapse"
                data-target="#acquistion"
                aria-expanded="false"
                aria-controls="acquistion"
                onClick={this.handleShowHide}
              >
                Show More
              </a>
            </p>

            <div className="task-title-head">
              <span className="task-title-body">
                Processing
              </span>
            </div>

            <div className="collapse" id="processing">

            <div className="form-group">
              <label className="col-sm-3 control-label">N.o. residues</label>
              <div className="col-sm-3">
                <input type="number" className="form-control" />
              </div>
              <label className="col-sm-3 control-label">Space group</label>
              <div className="col-sm-3">
               <select className="form-control" {...space_group}>
                <option value="1"></option>
                <option value="1">X</option>
                <option value="1">Y</option>
              </select>
              </div>
            </div>

            <h6>Unit cell:</h6>
            <div className="form-group">
              <label className="col-sm-2 control-label">a</label>
              <div className="col-sm-2">
                  <input type="number" className="form-control" />
              </div>

              <label className="col-sm-2 control-label">b</label>
              <div className="col-sm-2">
                  <input type="number" className="form-control" />
              </div>

              <label className="col-sm-2 control-label">c</label>
              <div className="col-sm-2">
                  <input type="number" className="form-control" />
              </div>

              <label className="col-sm-2 control-label">&alpha;</label>
              <div className="col-sm-2">
                  <input type="number" className="form-control" />
              </div>

              <label className="col-sm-2 control-label">&beta;</label>
              <div className="col-sm-2">
                  <input type="number" className="form-control" />
              </div>

              <label className="col-sm-2 control-label">&gamma;</label>
              <div className="col-sm-2">
                  <input type="number" className="form-control" />
              </div>
            </div>

            </div>

            <p className="text-right">
              <a
                data-toggle="collapse"
                data-target="#processing"
                aria-expanded="false"
                aria-controls="processing"
                onClick={this.handleShowHide}
              >
                Show More
              </a>
            </p>
              </form>
          </Modal.Body>
          <Modal.Footer className={this.props.taskData.state ? 'hidden' : 'task-footer'}>
        <div className={this.props.pointID === -1 ? 'pull-left' : 'hidden'}>
          <label className="centring-method">
            <input
              type="radio" {...centringMethod}
              value="lucid"
              checked={centringMethod.value === 'lucid'}
            />
            Lucid Only
          </label>
          <label className="centring-method">
            <input
              type="radio" {...centringMethod}
              value="xray"
              checked={centringMethod.value === 'xray'}
            />
            X-ray Centring
          </label>
        </div>
            <Button bsStyle="success"
              disabled={this.props.pointID === -1 || this.anyError()}
              onClick={this.runNow}
            >
              Run Now
            </Button>
            <Button bsStyle="primary" disabled={this.anyError()} onClick={this.addToQueue}>
              {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
            </Button>
          </Modal.Footer>
      </Modal>
        );
  }
}

DataCollection = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'datacollection',                           // a unique name for this form
  validate,
  fields: [
    'num_images',
    'first_image',
    'exp_time',
    'resolution',
    'osc_start',
    'energy',
    'osc_range',
    'transmission',
    'shutterless',
    'inverse_beam',
    'centringMethod',
    'detector_mode',
    'kappa',
    'kappa_phi',
    'space_group',
    'prefix',
    'run_number',
    'beam_size',
    'path'
  ] // all the fields in your form
},
state => ({ // mapStateToProps
  motorLimits: { ...state.beamline.motorsLimits },
  acqParametersLimits: { ...state.taskForm.acqParametersLimits },
  initialValues: {
    ...state.taskForm.taskData.parameters,
    beam_size: state.sampleview.currentAperture
  } // will pull state into form's initialValues
}))(DataCollection);

export default DataCollection;
