import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'
import SampleGrid from '../components/SampleGrid/SampleGrid'
import { Input, Button, Glyphicon, ButtonToolbar  } from "react-bootstrap"
import { doGetSamplesList, doUpdateSamples, doToggleSelected, doSelectAll, doFilter, doSyncSamples } from '../actions/samples_grid'
import { sendSample } from '../actions/queue'

class SampleGridContainer extends React.Component {
        addSamples() {
            // Loop through all samples, check which was selected and add to the queue. 
            Object.keys(this.props.samples_list).forEach(key => {

                if (this.props.samples_list[key].selected){
                  this.props.addSampleToQueue(key);
                }
               
            });
        }

        syncSamples() {
            try {
                var proposal_id = this.props.login_data.session.proposalId;
            } catch(e) {
                return
            } 
            
            this.props.syncSamples(proposal_id);
        }

	render() {
		const innerSearchIcon = (
			<Button onClick={() => { this.props.filter(this.refs.filter_input.getValue()) } }><Glyphicon glyph="search"/></Button>
		);

		return (<div>
                            <div className="row">
                                <div className="col-xs-3">
			            <form className="form-horizontal">
				        <Input type="text" ref="filter_input" defaultValue={this.props.filter_text} label="Filter" labelClassName="col-xs-2" wrapperClassName="col-xs-9" buttonAfter={innerSearchIcon}/>
			            </form>
                                </div>
                                <div className="col-xs-6">
                                   <ButtonToolbar>
                                       <Button className="btn-primary" onClick={this.props.getSamples}>Check sample changer contents</Button>
                                       <Button className="btn-primary" onClick={ () => { return this.syncSamples() }}>
                                            <Glyphicon glyph="refresh"/> Sync. ISPyB
                                       </Button>
                                   </ButtonToolbar>
                               </div>
                               <div className="col-xs-3">
			           <ButtonToolbar>
			               <Button className="btn-success pull-right" onClick={() => { this.addSamples() }}>
                                           <Glyphicon glyph="plus"/> Add samples
                                       </Button>
                                       <Button className="btn pull-right" onClick={this.props.selectAll}>Select all</Button>
			           </ButtonToolbar>
                               </div>
                            </div>
                            <div className="row"> 
				    <SampleGrid samples_list={this.props.samples_list} toggleSelected={this.props.toggleSelected} filter_text={this.props.filter_text}/>
                            </div>
			</div>)
	}
}

function mapStateToProps(state) {
    return Object.assign({}, state.samples_grid, { login_data: state.login.data })
}

function mapDispatchToProps(dispatch) {
    return {
        getSamples: () => dispatch(doGetSamplesList()),
        toggleSelected: (index) => dispatch(doToggleSelected(index)), 
        selectAll: () => dispatch(doSelectAll()),
        filter: (filter_text) => dispatch(doFilter(filter_text)),
        syncSamples: (proposal_id) => dispatch(doSyncSamples(proposal_id)),
        addSampleToQueue: (id) => dispatch(sendSample(id))
    }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridContainer)

