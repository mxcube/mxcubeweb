import React from 'react';
import { reduxForm } from 'redux-form';
import { Modal } from 'react-bootstrap';
/* eslint camelcase: 0 */

class Characterisation extends React.Component {


  constructor(props) {
    super(props);
    this.runNow = this.handleSubmit.bind(this, true);
    this.addToQueue = this.handleSubmit.bind(this, false);
  }

  handleSubmit(runNow) {
    const parameters = {
      ...this.props.values,
      type: 'Characterisation',
      point: this.props.pointId,
      typePrefix: 'P',
    };

    const stringFields = [
      'centringMethod',
      'detector_mode',
      'account_rad_damage',
      'opt_sad',
      'space_group',
      'strategy_complexity',
      'prefix',
      'path',
      'type',
      'point',
      'typePrefix'
    ];

    for (const key in parameters) {
      if (parameters.hasOwnProperty(key) && stringFields.indexOf(key) === -1 && parameters[key]) {
        parameters[key] = Number(parameters[key]);
      }
    }

    if (this.props.sampleIds.constructor === Array) {
      for (const sampleId of this.props.sampleIds) {
        if (this.props.queue[sampleId]) {
          this.props.addTask(sampleId, parameters, this.props.queue, runNow);
        } else {
          const sampleData = this.props.sampleList[sampleId];
          this.props.addSampleAndTask(sampleId, parameters, sampleData, this.props.queue, runNow);
        }
      }
    } else {
      const { taskData, sampleIds } = this.props;
      const taskIndex = this.props.queue[sampleIds].tasks.indexOf(taskData);
      this.props.changeTask(sampleIds, taskIndex, parameters, this.props.queue, runNow);
    }

    this.props.hide();
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
        exp_time,
        resolution,
        osc_start,
        energy,
        osc_range,
        transmission,
        centringMethod,
        detector_mode,
        kappa,
        kappa_phi,
        account_rad_damage,
        opt_sad,
        space_group,
        min_crystal_vdim,
        max_crystal_vdim,
        min_crystal_vphi,
        max_crystal_vphi,
        strategy_complexity,
        prefix,
        run_number,
        path,
        beam_size
      },
    rootPath
    } = this.props;

    return (
      <Modal show={this.props.show} onHide={this.props.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Characterisation</Modal.Title>
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
                  Filename: { `ref-${prefix.value}_${run_number.value}_xxxx.cbf`}
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

                <label className="col-sm-3 control-label">Number of images</label>
                <div className="col-sm-3">
                  <select className="form-control" {...num_images}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                  </select>
                </div>

                <label className="col-sm-3 control-label">Transmission (%)</label>
                <div className="col-sm-3">
                  <input type="number" className="form-control" {...transmission} />
                </div>

            </div>

            <div className="form-group">

              <label className="col-sm-3 control-label">Exposure time(ms)</label>
              <div className="col-sm-3">
                <input type="number" className="form-control" {...exp_time} />
              </div>
              <label className="col-sm-3 control-label">Beam size</label>
              <div className="col-sm-3">
                <select className="form-control" {...beam_size}>
                  {this.props.apertureList.map((val, i) =>
                    (<option key={i} value={val}>{val}</option>)
                  )}
                </select>
              </div>

            </div>

            <div className="form-group">

              <label className="col-sm-3 control-label">Oscillation range</label>
              <div className="col-sm-3">
                <input type="number" className="form-control" {...osc_range} />
              </div>

              <label className="col-sm-3 control-label">Resolution (Å)</label>
              <div className="col-sm-3">
                 <input type="number" className="form-control" {...resolution} />
              </div>

            </div>


            <div className="form-group">

                <label className="col-sm-3 control-label">Oscillation start</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...osc_start} />
                </div>

                <label className="col-sm-3 control-label">Energy (KeV)</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...energy} />
                </div>

            </div>
            <div className="collapse" id="acquisition">
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
                <label className="col-sm-3 control-label">Detector mode</label>
                <div className="col-sm-3">
                     <select className="form-control" {...detector_mode}>
                        <option value="1"></option>
                        <option value="1">X</option>
                        <option value="1">Y</option>
                    </select>
                </div>
            </div>
            </div>

              <p className="text-right">
                <a
                  data-toggle="collapse"
                  data-target="#acquisition"
                  aria-expanded="false"
                  aria-controls="acquisition"
                  onClick={this.handleShowHide}
                >
                  Show More
                </a>
            </p>
            <div className="task-title-head">
                <span className="task-title-body">
                    Characterisation
                </span>
            </div>
            <div className="collapse" id="characterisation">
            <div className="form-group">

                <label className="col-sm-6 control-label">Strategy complexity</label>
                <div className="col-sm-6">
                     <select className="form-control" {...strategy_complexity}>
                        <option value="1">Single subwedge</option>
                        <option value="2">Multiple subwedge</option>
                    </select>
                </div>

            </div>

            <div className="form-group">

                <label className="col-sm-6 control-label">
                    <input type="checkbox" {...account_rad_damage} />
                     Account for radiation damage
                </label>
                <label className="col-sm-6 control-label">
                    <input type="checkbox" {...opt_sad} />
                     Optimised SAD
                </label>

            </div>
            </div>
             <p className="text-right">
                <a
                  data-toggle="collapse"
                  data-target="#characterisation"
                  aria-expanded="false"
                  aria-controls="characterisation"
                  onClick={this.handleShowHide}
                >
                  Show More
                </a>
            </p>
            <div className="task-title-head">
                <span className="task-title-body">
                    Crystal
                </span>
            </div>
          <div className="collapse" id="crystal">
            <div className="form-group">

                <label className="col-sm-6 control-label">Space group</label>
                <div className="col-sm-6">
                     <select className="form-control" {...space_group}>
                        <option value="1"></option>
                        <option value="1">X</option>
                    </select>
                </div>

            </div>
            <h6>Vertical crystal dimension(mm)</h6>
            <div className="form-group">

                <label className="col-sm-3 control-label">Min</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...min_crystal_vdim} />
                </div>

                <label className="col-sm-3 control-label">Max</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...max_crystal_vdim} />
                </div>

                <label className="col-sm-3 control-label">  &omega; at min</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...min_crystal_vphi} />
                </div>

                <label className="col-sm-3 control-label">  &omega; at max</label>
                <div className="col-sm-3">
                    <input type="number" className="form-control" {...max_crystal_vphi} />
                </div>

            </div>
          </div>
            <p className="text-right">
                <a
                  data-toggle="collapse"
                  data-target="#crystal"
                  aria-expanded="false"
                  aria-controls="crystal"
                  onClick={this.handleShowHide}
                >
                  Show More
                </a>
            </p>
        </form>
          </Modal.Body>
          <Modal.Footer>
        <div className={this.props.pointId === -1 ? 'pull-left' : 'hidden'}>
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
            <button
              type="button"
              className={this.props.pointId !== -1 ? 'btn btn-success' : 'hidden'}
              onClick={this.runNow}
            >
              Run Now
            </button>
            <button type="button" className="btn btn-primary" onClick={this.addToQueue}>
              {this.props.taskData.sampleID ? 'Change' : 'Add to Queue'}
            </button>
        </Modal.Footer>
      </Modal>
        );
  }
}

Characterisation = reduxForm({ // <----- THIS IS THE IMPORTANT PART!
  form: 'characterisation',                           // a unique name for this form
  fields: [
    'num_images',
    'exp_time',
    'resolution',
    'osc_start',
    'energy',
    'osc_range',
    'transmission',
    'centringMethod',
    'detector_mode',
    'kappa',
    'kappa_phi',
    'account_rad_damage',
    'opt_sad',
    'space_group',
    'min_crystal_vdim',
    'max_crystal_vdim',
    'min_crystal_vphi',
    'max_crystal_vphi',
    'strategy_complexity',
    'prefix',
    'run_number',
    'path',
    'beam_size'
  ] // all the fields in your form
},
state => ({ // mapStateToProps
  initialValues: {
    ...state.taskForm.taskData.parameters,
    beam_size: state.sampleview.currentAperture,
    path: state.login.loginInfo.loginRes.Proposal.code
  } // will pull state into form's initialValues
}))(Characterisation);

export default Characterisation;
